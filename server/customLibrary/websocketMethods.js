const CONSTANTS = require('./websocketConstants')

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

function createUpgradeHeader() {
  let headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-Websocket-Accept: ???',
  ]
}

module.exports = {
  isOriginAllowed,
  check
}