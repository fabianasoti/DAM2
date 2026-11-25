// Página del chat: se conecta al servidor por WebSocket y muestra la conversación

// El servidor está en el mismo ordenador que sirve esta página (puerto 8765)
const direccion = "ws://" + (location.hostname || "localhost") + ":8765"

let conexion = null
let pensando = null   // burbuja "pensando..." mientras esperamos una respuesta

const entrada = document.querySelector("#entrada")
const chat = document.querySelector("#chat")
const aviso = document.querySelector("#aviso")
const mensajes = document.querySelector("#mensajes")
const cuadroTexto = document.querySelector("#texto")

// ---------- Entrar ----------
document.querySelector("#conectar").onclick = function () {
  const nombre = document.querySelector("#nombre").value.trim()
  const clave = document.querySelector("#clave").value

  if (nombre === "" || clave === "") {
    aviso.textContent = "Escribe tu nombre y la clave del aula"
    return
  }

  aviso.textContent = "Conectando..."
  conexion = new WebSocket(direccion)

  // Al abrirse la conexión, nos presentamos
  conexion.onopen = function () {
    conexion.send(JSON.stringify({ tipo: "hola", rol: "usuario", nombre: nombre, clave: clave }))
  }

  conexion.onmessage = alRecibir

  conexion.onerror = function () {
    aviso.textContent = "No se puede conectar con el servidor del chat"
  }

  conexion.onclose = function () {
    if (!chat.classList.contains("oculto")) {
      anadir("sistema", "Se ha cerrado la conexión con el servidor.")
      cuadroTexto.disabled = true
    }
  }
}

// ---------- Mensajes que llegan del servidor ----------
function alRecibir(evento) {
  const datos = JSON.parse(evento.data)

  if (datos.tipo === "registrado") {
    entrada.classList.add("oculto")
    chat.classList.remove("oculto")
    mostrarEstado(datos.ias)
    anadir("sistema", "Conectado. Escribe tu primera pregunta.")
  }

  if (datos.tipo === "estado") {
    mostrarEstado(datos.ias)
  }

  if (datos.tipo === "respuesta") {
    quitarPensando()
    anadir("ia", datos.texto, "Respondió " + datos.ia + " en " + datos.segundos + " s")
  }

  if (datos.tipo === "error") {
    quitarPensando()
    // Antes de entrar, el error se muestra en la pantalla de entrada
    if (chat.classList.contains("oculto")) {
      aviso.textContent = datos.mensaje
    } else {
      anadir("sistema", datos.mensaje)
    }
  }
}

function mostrarEstado(numeroIas) {
  const punto = document.querySelector("#punto")
  const texto = document.querySelector("#estado")
  if (numeroIas > 0) {
    punto.className = "punto activo"
    texto.textContent = numeroIas + (numeroIas === 1 ? " IA conectada" : " IAs conectadas")
  } else {
    punto.className = "punto"
    texto.textContent = "Ninguna IA conectada"
  }
}

// ---------- Enviar una pregunta ----------
document.querySelector("#formulario").onsubmit = function (evento) {
  evento.preventDefault()    // que la página no se recargue

  const texto = cuadroTexto.value.trim()
  if (texto === "" || texto.length > 500) return
  if (conexion === null || conexion.readyState !== WebSocket.OPEN) return

  anadir("yo", texto)
  conexion.send(JSON.stringify({ tipo: "pregunta", texto: texto }))
  cuadroTexto.value = ""

  quitarPensando()
  pensando = anadir("ia", "Pensando...", "")
  pensando.classList.add("pensando")
}

// ---------- Burbujas ----------
function anadir(quien, texto, pie) {
  const burbuja = document.createElement("div")
  burbuja.className = "burbuja " + quien

  const parrafo = document.createElement("p")
  parrafo.textContent = texto    // textContent: nunca interpreta el texto como HTML
  burbuja.appendChild(parrafo)

  if (pie) {
    const nota = document.createElement("small")
    nota.textContent = pie
    burbuja.appendChild(nota)
  }

  mensajes.appendChild(burbuja)
  mensajes.scrollTop = mensajes.scrollHeight
  return burbuja
}

function quitarPensando() {
  if (pensando !== null) {
    pensando.remove()
    pensando = null
  }
}
