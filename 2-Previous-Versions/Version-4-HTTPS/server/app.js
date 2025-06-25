const HTTPS = require('https')
const fs = require('fs')

const CONSTANTS = require('./customLibrary/websocketConstants')
const FUNCTIONS = require('./customLibrary/websocketMethods')

const serverKey = fs.readFileSync('cert.key')
const serverCert = fs.readFileSync('cert.crt')

const HTTPS_SERVER = HTTPS.createServer({
  key: serverKey, 
  cert: serverCert
}, (req, res) => {
  res.writeHead(200)
  res.end('OK response')
})

HTTPS_SERVER.listen(CONSTANTS.PORT, () => {
  console.log(`HTTPS Server listening on Port ${CONSTANTS.PORT}`)
})

CONSTANTS.CUSTOM_ERRORS.forEach( errorEvent => {
  process.on(errorEvent, (err) => {
    console.log(`Error Event Alert: ${errorEvent}. Error Object:`, err)
    process.exit(1)
  })
})

HTTPS_SERVER.on('upgrade', (req, socket, head) => {
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

}