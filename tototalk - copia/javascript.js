document.addEventListener("DOMContentLoaded", function() {
  const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
  const CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
  const connectButton = document.getElementById('connect')
  const warningMessage = document.getElementById('warning-message')
  const textSign = document.getElementById('text-sign')
  const errorMessage = document.getElementById('error-message')
  const errorMessageText = document.getElementById('error-message-text')
  const audioHola = new Audio('hola-cmo-estas.mp3')
  const audioAyuda = new Audio('porfavor-necesito-ayuda.mp3')
  const audioComida = new Audio('hambre.mp3')
  const audioBaño = new Audio('necesito-ir-al-baño.mp3')
  const audioGracias = new Audio('gracias-por-la-ayuda.mp3')
  
 
  let device, signChar, word

  async function requestDevice() {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "BBC micro:bit" }],
      optionalServices: [SERVICE_UUID],
    })

    device.addEventListener('gattserverdisconnected', connectDevice)
  }

  const translate = (string) => {
    const number = Number(string)

    if (number >= -25 && number <= 35) {
      if (word !== 'Tengo hambre, quiero comer algo') audioComida.play()
      word = 'Tengo hambre, quiero comer algo'
    } else if (number >= 35 && number <= 75) {
      if (word !== 'Hola, ¿cómo estás?') audioHola.play()
      word = 'Hola, ¿cómo estás?'
    } else if (number >= -75 && number <= -25) {
      if (word !== 'Por favor, necesito ayuda.') audioAyuda.play()
      word = 'Por favor, necesito ayuda'
    } else if (number >= 115 && number <= 140) {
      if (word !== 'Necesito ir al baño') audioBaño.play()
      word = 'Necesito ir al baño'
      }else if (number >= 150 && number <= 180) {
        if (word !== 'Gracias por la ayuda ' ) audioGracias.play()
        word = 'Gracias por la ayuda'
      }
    return word
  }

  function parseSignGlove(event) {
    let receivedData = []
    for (var i = 0; i < event.target.value.byteLength; i++) {
      receivedData[i] = event.target.value.getUint8(i)
    }
    return translate(String.fromCharCode.apply(null, receivedData))
  }

  async function connectDevice() {
    if (device.gatt.connected) return

    const server = await device.gatt.connect()
    const service = await server.getPrimaryService(SERVICE_UUID)
    signChar = await service.getCharacteristic(CHARACTERISTIC_UUID)
    signChar.addEventListener('characteristicvaluechanged', (event) => {
      textSign.textContent = parseSignGlove(event)
    })
  }

  async function startMonitoring() {
    await signChar.startNotifications()
  }

  connectButton.addEventListener('click', async () => {
    if (!navigator.bluetooth) {
      warningMessage.classList.remove('d-none')
      connectButton.classList.add('d-none')
      return
    }
    if (!device) {
      try {
        if (!errorMessage.classList.contains('d-none')) errorMessage.classList.add('d-none')

        await requestDevice()

        connectButton.innerHTML = `
          <span class="spinner-grow spinner-grow-sm" aria-hidden="true"></span>
          <span role="status">Conectando...</span>
        `
        connectButton.disabled = true

        await connectDevice()

        if (device) {
          connectButton.classList.add('d-none')
          textSign.classList.remove('d-none')
          await startMonitoring()
        } else {
          connectButton.textContent = 'Conectar guante'
          connectButton.disabled = false
        }
      } catch (error) {
        console.log(error.message)
        connectButton.textContent = 'Conectar guante'
        connectButton.disabled = false
        errorMessageText.textContent = error.message
        errorMessage.classList.remove('d-none')
        device = undefined
      }
    }
  })
})
