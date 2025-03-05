module.exports = {
  PORT: 8080,
  CUSTOM_ERRORS: [
    'uncaughtException',
    'unhandledRejection',
    'SIGINT',     
  ],
  METHOD: "GET",
  VERSION: 13,
  CONNECTION: 'upgrade',
  UPGRADE: 'websocket'
}

