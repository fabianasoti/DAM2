// Cliente web del chat.
// Se conecta por WebSocket a la pasarela (pasarela.py), que lo une al servidor de chat.

const PUERTO = 8765

// Misma dirección desde la que se abrió la página (localhost, o la IP del servidor)
const direccion = "ws://" + (location.hostname || "localhost") + ":" + PUERTO

const mensajes = document.querySelector("#mensajes")
const formulario = document.querySelector("#formulario")
const campoTexto = document.querySelector("#texto")
const textoEstado = document.querySelector("#estado")
const textoApodo = document.querySelector("#apodo")
const botonUsuarios = document.querySelector("#usuarios")
const botonReconectar = document.querySelector("#reconectar")

let conexion = null
let miApodo = ""


// Añade una línea a la zona de mensajes y baja al final
function mostrar(elemento){
  mensajes.appendChild(elemento)
  mensajes.scrollTop = mensajes.scrollHeight
}

// Aviso del sistema (entradas, salidas, errores...)
function mostrarSistema(texto){
  let linea = document.createElement("div")
  linea.className = "sistema"
  linea.textContent = texto
  mostrar(linea)
}

// Mensaje de un usuario. Llega como:  [16:28] ana: hola
function mostrarMensaje(texto){

  let finHora = texto.indexOf("] ")
  let finApodo = texto.indexOf(": ", finHora)

  // Si no tiene el formato esperado, lo enseño tal cual
  if(finHora == -1 || finApodo == -1){
    mostrarSistema(texto)
    return
  }

  let hora = texto.substring(1, finHora)
  let autor = texto.substring(finHora + 2, finApodo)
  let contenido = texto.substring(finApodo + 2)

  let burbuja = document.createElement("div")
  burbuja.className = (autor == miApodo) ? "mensaje mio" : "mensaje"

  let cabecera = document.createElement("div")
  cabecera.className = "autor"
  cabecera.textContent = autor

  let horaTexto = document.createElement("span")
  horaTexto.className = "hora"
  horaTexto.textContent = hora
  cabecera.appendChild(horaTexto)

  let cuerpo = document.createElement("div")
  cuerpo.textContent = contenido     // textContent: así nadie puede meter HTML

  burbuja.appendChild(cabecera)
  burbuja.appendChild(cuerpo)
  mostrar(burbuja)
}

function cambiarEstado(texto, conectado){
  textoEstado.textContent = texto
  textoEstado.className = conectado ? "conectado" : "desconectado"
  botonReconectar.hidden = conectado
}


// ---------------------------------------------
// Conexión
// ---------------------------------------------
function conectar(){

  cambiarEstado("Conectando...", false)
  conexion = new WebSocket(direccion)

  conexion.onopen = function(){
    cambiarEstado("Conectado", true)
    campoTexto.focus()
  }

  // Llega una línea del servidor
  conexion.onmessage = function(evento){

    let texto = evento.data

    if(texto.startsWith("@apodo ")){
      // Aviso interno: el servidor me dice cuál es mi apodo
      miApodo = texto.substring(7)
      textoApodo.textContent = miApodo
    }else if(texto.startsWith("[")){
      mostrarMensaje(texto)
    }else{
      mostrarSistema(texto)
    }
  }

  conexion.onclose = function(){
    cambiarEstado("Desconectado", false)
    mostrarSistema("Se ha perdido la conexión con el chat.")
  }

  conexion.onerror = function(){
    // onclose se ejecuta justo después y ya avisa
  }
}


// ---------------------------------------------
// Enviar mensajes
// ---------------------------------------------
function enviar(texto){
  if(conexion && conexion.readyState == WebSocket.OPEN){
    conexion.send(texto)
  }else{
    mostrarSistema("No estás conectado.")
  }
}

formulario.onsubmit = function(evento){
  evento.preventDefault()               // que la página no se recargue

  let texto = campoTexto.value.trim()
  if(texto == ""){ return }

  enviar(texto)
  campoTexto.value = ""
}

botonUsuarios.onclick = function(){
  enviar("/usuarios")
}

botonReconectar.onclick = function(){
  conectar()
}


conectar()
