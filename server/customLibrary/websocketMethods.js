const CONSTANTS = require('./websocketConstants')

function isOriginAllowed(origin) {
  return CONSTANTS.ALLOWED_ORIGINS.includes(origin)
}

module.exports = {
  isOriginAllowed,
}