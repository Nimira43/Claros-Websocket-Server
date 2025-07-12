const HTTP = require('http')
const CONSTANTS = require('./customLibrary/websocketConstants')
const FUNCTIONS = require('./customLibrary/websocketMethods')

const GET_INFO = 1
// const GET_LENGTH = 2
// const GET_MASK_KEY = 3
// const GET_PAYLOAD = 4
// const SEND_ECHO = 5 

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
  const origin =req.headers['origin']
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
    console.log('Chunk received.')
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

  processBuffer(chunk) {
    this._buffersArray.push(chunk)
    this._bufferedBytesLength += chunk.length
    this._startTaskLoop()
  }

  _startTaskLoop() {
    this._taskLoop = true

    do {
      switch(this._task) {
        case GET_INFO:
          this.getInfo()
          break
      }
    } while (this._taskLoop)
  }

  _getInfo() {
    const infoBuffer = this._consumeHeaders(CONSTANTS.MIN_FRAME_SIZE)
  }
}