let openWsBtn = document.getElementById('open-ws')
let closeWsBtn = document.getElementById('close-ws')
let populateBtn = document.getElementById('populate')

let form = document.getElementById('form')
let socketStatus = document.getElementById('status')
let table = document.getElementsByTagName('ul')[0]
let message = document.getElementById('message')

let text = 'A'.repeat(150000)

openWsBtn.addEventListener('click', () => {
  openWsBtn.disabled = true
  openWsBtn.style.background = '#111'
  openWsBtn.style.color = '#fffcfa'
  openWsBtn.style.pointerEvents = 'none'
  openWsBtn.textContent = 'Button Disabled'
  socketStatus.innerHTML = 'Connecting...'
  
  let url = 'ws://127.0.0.1:8080'
  let socket = new WebSocket(url)

  socket.onopen = (openEvent) => {

    console.log("SOCKET CONNECTING STATUS IS: " + socket.readyState)

    table.innerHTML = ''

    console.log("SOCKET CONNECTING STATUS IS: " + socket.readyState)

    socketStatus.innerHTML = `Connected to: ${openEvent.currentTarget.url}`
    socketStatus.className = 'open'
    form.className = 'show'
    populateBtn.addEventListener('click', () => {
      message.value = text
    })
  }

  socket.onmessage = function(messageEvent) {
    console.log(socket)
    console.log(messageEvent)

    if (messageEvent.data instanceof Blob) {
      const reader = new FileReader()

      reader.readAsText(messageEvent.data)
      reader.onload = function(e) {
        const msg = e.target.result
        table.innerHTML += `
          <li><span>Received: </span> ${msg}</li>
        `
        message.placeholder = `(Previous message size: ${msg.length})`
      }
    }
  }

  socket.onclose = (closeEventObject) => {
    console.log("CLOSE EVENT FIRED. CLOSE OBJECT", closeEventObject);

    socketStatus.className = 'closed'
    table.innerHTML = ''
    switch (closeEventObject.code) {
      case 1006: // network issue
        socketStatus.innerHTML = 'Issue with Websocket Connection'
        break
      case 1001: // peer closes connection
        socketStatus.innerHTML = `Disconnected: ${closeEventObject.reason}`
        table.innerHTML = ''
        break
      default:
        socketStatus.innerHTML = `You have disconnected`
    }
    form.classList.remove('show')
    message.setAttribute('required', 'true')
    openWsBtn.disabled = false
    openWsBtn.style.background = ''
    openWsBtn.style.pointerEvents = ''
    openWsBtn.textContent = 'Open Websocket'
  }

  socket.onerror = (error) => {
    console.log('Error event was thrown. ERROR OBJECT: ', error)
    socketStatus.innerHTML = 'Error'
    socketStatus.className = 'closed'
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    if (socket.readyState === 1) {
      let userText = message.value
      socket.send(userText)
      table.innerHTML += '<li class="sent"><span>SENT:</span>' + userText + '</li>'
      message.value = ''
    }
  })
  closeWsBtn.addEventListener('click', () => {
    socketStatus.innerHTML = 'Closing... Please Wait...'
    socketStatus.classList.add('closing')
    socket.close(1000, 'Terminated')
    message.removeAttribute('required')
    form.classList.remove('show')
  })
})