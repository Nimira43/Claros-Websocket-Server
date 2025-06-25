module.exports = {
  PORT: process.env.PORT || 4430,
  
  CUSTOM_ERRORS: [
    'uncaughtException',
    'unhandledRejection',
    'SIGINT',     
  ],
  METHOD: 'GET',
  VERSION: 13,
  CONNECTION: 'upgrade',
  UPGRADE: 'websocket',
  ALLOWED_ORIGINS: [
    'https://localhost:5500',
    'https://127.0.0.1:5500',
    'null'
  ],
  GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
}

