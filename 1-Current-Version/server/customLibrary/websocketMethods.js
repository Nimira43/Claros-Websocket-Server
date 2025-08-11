const CONSTANTS = require('./websocketConstants')
const crypto = require('crypto')

function isOriginAllowed(origin) {
  return CONSTANTS.ALLOWED_ORIGINS.includes(origin)
}

function check(socket, upgradeHeaderCheck, connectionHeaderCheck, methodCheck, originCheck) {
  if (upgradeHeaderCheck && connectionHeaderCheck && methodCheck && originCheck) {
    return true
  } else {
    const message = '400 bad request. The HTTP headers do not comply with RFC6455 specifactions.'
    const messageLength = message.length
    const response = 
      `HTTP/1.1 400 Bad Request\r\n` +
      `Content-Type: text/plain\r\n` +
      `Content-Length: ${messageLength}\r\n` +
      `\r\n` +
      message
    socket.write(response)
    socket.end()
  }
}

function createUpgradeHeaders(clientKey) {
  let serverKey = generateServerKey(clientKey)
  let headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-Websocket-Accept: ${serverKey}`
  ]
  const upgradeHeaders = headers.join('\r\n') + '\r\n\r\n'
  return upgradeHeaders
}

function generateServerKey(clientKey) {
  let data = clientKey + CONSTANTS.GUID
  const hash = crypto.createHash('sha1')
  hash.update(data)
  let serverKey = hash.digest('base64')
  return serverKey
}

function _unmaskPayload(payloadBuffer, maskKey) {
  for (let i = 0; i < payloadBuffer.length; i++) {
    payloadBuffer[i] = payloadBuffer[i] ^ maskKey[i % CONSTANTS.MASK_LENGTH]
  }
}

module.exports = {
  isOriginAllowed,
  check,
  createUpgradeHeaders,
}