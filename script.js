let openWsBtn = document.getElementById('open-ws')
let closeWsBtn = document.getElementById('close-ws')
let form = document.getElementById('form')
let socketStatus = document.getElementById('status')
let table = document.getElementById('ul')[0]
let message = document.getElementById('message')

openWsBtn.addEventListener('click', () => {
  openWsBtn.disabled = true
  openWsBtn.style.background = 'gray'
  openWsBtn.style.pointerEvents = 'none'
  openWsBtn.textContent = 'Button Disabled'

})