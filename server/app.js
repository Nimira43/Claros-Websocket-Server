const HTTP = require('http')
const CONSTANTS = require('./customLibrary/websocketConstants')
const FUNCTIONS = require('./customLibrary/websocketMethods')

const HTTP_SERVER = HTTP.createServer((req, res) => {
  res.writeHead(200)
  res.end('OK response')
})

