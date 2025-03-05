const CONSTANTS = require('./websocketConstants')

function isOriginAllowed(origin) {
  return CONSTANTS.ALLOWED_ORIGINS.includes(origin)
}

function check(upgradeHeaderCheck, connectionHeaderCheck, methodCheck, originCheck) {
  if (upgradeHeaderCheck && connectionHeaderCheck && methodCheck && originCheck) {
    return true
  } else {
    throw new Error('Cannot connect. The HTTP headers are not in accordance with RFC 6455 Spec.')
  }
}

module.exports = {
  isOriginAllowed,
  check
}