const HTTP = require('http')
const CONSTANTS = require('./customLibrary/websocketConstants')
const FUNCTIONS = require('./customLibrary/websocketMethods')

const GET_INFO = 1
const GET_LENGTH = 2
const GET_MASK_KEY = 3
const GET_PAYLOAD = 4
const SEND_ECHO = 5 
const GET_CLOSE_INFO = 6

const HTTP_SERVER = HTTP.createServer((req, res) => {
  res.writeHead(200)
  res.end('OK response')
})

HTTP_SERVER.listen(CONSTANTS.PORT, () => {
  console.log(`HTTP Server listening on Port ${CONSTANTS.PORT}`)
})

CONSTANTS.CUSTOM_ERRORS.forEach( errorEvent => {
  process.on(errorEvent, (err) => {
    console.log(`Error Event Alert: ${errorEvent}. Error Object:`, err)
    process.exit(1)
  })
})

HTTP_SERVER.on('upgrade', (req, socket, head) => {
  const upgradeHeaderCheck = req.headers['upgrade'].toLowerCase() === CONSTANTS.UPGRADE
  const connectionHeaderCheck = req.headers['connection'].toLowerCase() === CONSTANTS.CONNECTION
  const methodCheck = req.method === CONSTANTS.METHOD
  const origin = req.headers['origin']
  const originCheck = FUNCTIONS.isOriginAllowed(origin)

  if (FUNCTIONS.check(socket, upgradeHeaderCheck, connectionHeaderCheck, methodCheck, originCheck)) {
    upgradeConnection(req, socket, head)
  }
})

function upgradeConnection(req, socket, head) {
  const clientKey = req.headers['sec-websocket-key']
  const headers = FUNCTIONS.createUpgradeHeaders(clientKey)
  socket.write(headers)
  startWebSocketConnection(socket)
}

function startWebSocketConnection(socket) {
  console.log(`Websocket connection established with Client on Port ${socket.remotePort}`)

  const receiver = new WebSocketReceiver(socket)

  socket.on('data', (chunk) => {
    receiver.processBuffer(chunk)
  })
  socket.on('end', () => {
    console.log('Websocket closed. There will be no more data.')
  })
}

class WebSocketReceiver {
  constructor(socket) {
    this._socket = socket
  }

  _buffersArray = []
  _bufferedBytesLength = 0
  _taskLoop = false
  _task = GET_INFO
  _fin = false
  _opcode = null
  _masked = false
  _initialPayloadSizeIndicator = 0
  _framePayloadLength = 0 
  _maxPayload = 1024 * 1024
  _totalPayloadLength = 0
  _mask = Buffer.alloc(CONSTANTS.MASK_LENGTH)
  _framesReceived = 0
  _fragments = []

  processBuffer(chunk) {
    this._buffersArray.push(chunk)
    this._bufferedBytesLength += chunk.length
    console.log('Chunk received. Size: ' + chunk.length)
    this._startTaskLoop()
  }

  _startTaskLoop() {
    this._taskLoop = true

    do {
      switch(this._task) {
        case GET_INFO:
          this._getInfo()
          break
        case GET_LENGTH:
          this._getLength()
          break
        case GET_MASK_KEY:
          this._getMaskKey()
          break
        case GET_PAYLOAD:
          this._getPayload()
          break
        case SEND_ECHO:
          this._sendEcho()
          break
        case GET_CLOSE_INFO:
          this._getCloseInfo()
          break
      }
    } while (this._taskLoop)
  }

  _getInfo() {
    if (this._bufferedBytesLength < CONSTANTS.MIN_FRAME_SIZE) {
      this._taskLoop = false
      return
    }

    const infoBuffer = this._consumeHeaders(CONSTANTS.MIN_FRAME_SIZE)
    const firstByte = infoBuffer[0]
    const secondByte = infoBuffer[1]

    this._fin = (firstByte & 0b10000000) === 0b10000000
    this._opcode = firstByte & 0b00001111 
    this._masked = (secondByte & 0b10000000) === 0b10000000
    this._initialPayloadSizeIndicator = secondByte & 0b01111111

    if (!this._masked) {
      // throw new Error ('Mask is not set by the Client.')
      this._sendClose(1002, 'Mask must be set.')
    }

    if ([CONSTANTS.OPCODE_PING, CONSTANTS.OPCODE_PONG].includes(this._opcode)) {
      this._sendClose(1003, 'The server does not accept ping or pong frames.')
    }

    this._task = GET_LENGTH
  }

  _consumeHeaders(n) {
    this._bufferedBytesLength -= n
    if (n === this._buffersArray[0].length) {
      return this._buffersArray.shift()
    }
    if (n < this._buffersArray[0].length) {
      const infoBuffer = this._buffersArray[0]
      this._buffersArray[0] = this._buffersArray[0].slice(n)
      return infoBuffer.slice(0, n)
    } else {
      throw Error('You cannot extract more data from a Websocket frame than the actual frame size.')
    }   
  }
  
  _getLength() {
    switch (this._initialPayloadSizeIndicator) {
      case CONSTANTS.MEDIUM_DATA_FLAG:
        let mediumPayloadLengthBuffer = this._consumeHeaders(CONSTANTS.MEDIUM_SIZE_CONSUMPTION)
        this._framePayloadLength = mediumPayloadLengthBuffer.readUInt16BE()
        this._processLength()
        break
      case CONSTANTS.LARGE_DATA_FLAG:
        let largePayloadLengthBuffer = this._consumeHeaders(CONSTANTS.LARGE_SIZE_CONSUMPTION)
        let bufBigInt = largePayloadLengthBuffer.readBigUInt64BE()
        this._framePayloadLength = Number(bufBigInt)
        this._processLength()
        break
      default:
        this._framePayloadLength = this._initialPayloadSizeIndicator
        this._processLength()
    }     
  }

  _processLength() {
    this._totalPayloadLength += this._framePayloadLength
    if (this._totalPayloadLength > this._maxPayload ) {
      this._sendClose(1009, 'The Websocket server does not support such huge message lengths.')
    }
    this._task = GET_MASK_KEY
  }

  _getMaskKey() {
    this._mask = this._consumeHeaders(CONSTANTS.MASK_LENGTH)
    this._task = GET_PAYLOAD
  }

  _getPayload() {
    if (this._bufferedBytesLength < this._framePayloadLength) {
      this._taskLoop = false
      return
    }
    this._framesReceived++

    let frame_masked_payload_buffer = this._consumePayload(this._framePayloadLength)

    let frame_unmasked_payload_buffer = FUNCTIONS._unmaskPayload(frame_masked_payload_buffer, this._mask)

    if (frame_unmasked_payload_buffer.length) {
      this._fragments.push(frame_unmasked_payload_buffer)
    }

    if (this._opcode === CONSTANTS.OPCODE_CLOSE) {
      throw new Error('Server has not yet dealt with a closure frame.')
    }

    if ([CONSTANTS.OPCODE_BINARY, CONSTANTS.OPCODE_PING, CONSTANTS.OPCODE_PONG].includes(this._opcode)) {
      throw new Error('Server has not yet dealt with this type of frame.')
    }

    if (frame_unmasked_payload_buffer.length) {
      this._fragments.push(frame_unmasked_payload_buffer)
    }

    if (!this._fin) {
      this._task = GET_INFO
    } else {
      console.log(`Total frames received in this Websocket message: ${this._framesReceived}`)
      console.log(`Total payload size of the Websocket message: ${this._totalPayloadLength}`)

      this._task = SEND_ECHO
    }
  }

  _consumePayload(n) {
    this._bufferedBytesLength -= n
    const payloadBuffer = Buffer.alloc(n)
    let totalBytesRead = 0

    while(totalBytesRead < n) {
      const buf = this._buffersArray[0]
      const bytesToRead = Math.min(n - totalBytesRead, buf.length)
      buf.copy(payloadBuffer, totalBytesRead, 0, bytesToRead)
      totalBytesRead += bytesToRead

      if (bytesToRead < buf.length) {
        this._buffersArray[0] = buf.slice(bytesToRead)
      } else {
        this._buffersArray.shift()
      }
    }
    return payloadBuffer
  }

  _sendEcho() {
    const fullMessage = Buffer.concat(this._fragments)
    let payloadLength = fullMessage.length
    let additionalPayloadSizeIndicator = null

    switch (true) {
      case (payloadLength <= CONSTANTS.SMALL_DATA_SIZE):
        additionalPayloadSizeIndicator = 0
        break
      case (payloadLength > CONSTANTS.SMALL_DATA_SIZE && payloadLength <= CONSTANTS.MEDIUM_DATA_SIZE):
        additionalPayloadSizeIndicator = CONSTANTS.MEDIUM_SIZE_CONSUMPTION
        break
      default:
        additionalPayloadSizeIndicator = CONSTANTS.LARGE_SIZE_CONSUMPTION
    }

    const frame = Buffer.alloc(CONSTANTS.MIN_FRAME_SIZE + additionalPayloadSizeIndicator + payloadLength)

    let fin = 0x01
    let rsv1 = 0x00
    let rsv2 = 0x00
    let rsv3 = 0x00
    let opcode = CONSTANTS.OPCODE_BINARY

    let firstByte = (fin << 7) | 
                    (rsv1 << 6) | 
                    (rsv2 << 5) |
                    (rsv3 << 4) |
                    opcode
    frame[0] = firstByte

    let maskingBit = 0x00

    if (payloadLength <= CONSTANTS.SMALL_DATA_SIZE) {
      frame[1] = (maskingBit | payloadLength)
    } else if (payloadLength <= CONSTANTS.MEDIUM_DATA_SIZE) {
      frame[1] = (maskingBit | CONSTANTS.MEDIUM_DATA_FLAG)
      frame.writeUInt16BE(payloadLength, CONSTANTS.MIN_FRAME_SIZE)
    } else {
      frame[1] = (maskingBit | CONSTANTS.LARGE_DATA_FLAG)
      frame.writeBigInt64BE(BigInt(payloadLength), CONSTANTS.MIN_FRAME_SIZE)
    }
    
    const messageStartOffset = CONSTANTS.MIN_FRAME_SIZE + additionalPayloadSizeIndicator
    fullMessage.copy(frame, messageStartOffset)

    this._socket.write(frame)
    this._reset()
  }

  _reset() {
    this._buffersArray = []
    this._bufferedBytesLength = 0
    this._taskLoop = false
    this._task = GET_INFO
    this._fin = false
    this._opcode = null
    this._masked = false
    this._initialPayloadSizeIndicator = 0
    this._framePayloadLength = 0
    this._totalPayloadLength = 0
    this._mask = Buffer.alloc(CONSTANTS.MASK_LENGTH)
    this._framesReceived = 0
    this._fragments = []
  }

  _getCloseInfo() {
    let closeFramePayload = this._fragments[0]
    
    if (!closeFramePayload) {
      this._sendClose(1008, 'Next time please set the status code')
      return
    }

    let closeCode = closeFramePayload.readUInt16BE()
    let closeReason = closeFramePayload.toString('utf8', 2)

    if (closeCode === 1001) {
      this._socket.end()
      this._reset()
      return
    }
    console.log(`Received close frame with code: ${closeCode} and reason: ${closeReason}`)
    let serverResponse = 'Goodbye. Please open up a new connection.'
    this._sendClose(closeCode, serverResponse)
  }

  _sendClose(closeCode, closeReason) {
    let closureCode = (typeof closeCode !== 'undefined' && closeCode) ? closeCode : 1000
    let closureReason = (typeof closeReason !== 'undefined && closeReason') ? closeReason : ''
    const closureReasonBuffer = Buffer.from(closureReason, 'utf8')
    const closureReasonLength = closureReasonBuffer.length
    const closeFramePayload = Buffer.alloc(2 + closureReasonLength)
    closeFramePayload.writeInt16BE(closureCode, 0)
    closureReasonBuffer.copy(closeFramePayload, 2)
    const firstByte = 0b10000000 | 0b00000000 | 0b00001000
    const secondByte = closeFramePayload.length
    const mantatoryCloseHeaders = Buffer.from([firstByte, secondByte])
    const closeFrame = Buffer.concat([mantatoryCloseHeaders, closeFramePayload])
    this._socket.write(closeFrame)
    this._socket.end()
    this._reset()
  }
}