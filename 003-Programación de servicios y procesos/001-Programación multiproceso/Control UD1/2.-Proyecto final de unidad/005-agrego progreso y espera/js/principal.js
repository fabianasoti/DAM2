// Incremental 005: progreso y espera.
// Cada foto es una "promesa": se cumple cuando su worker la devuelve filtrada.
// Promise.all espera a que se cumplan TODAS antes de dar el trabajo por terminado.

const entrada = document.querySelector("#entrada")
const selectorFiltro = document.querySelector("#filtro")
const campoRepeticiones = document.querySelector("#repeticiones")
const selectorWorkers = document.querySelector("#numworkers")
const textoNucleos = document.querySelector("#nucleos")
const botonAplicar = document.querySelector("#aplicar")
const galeria = document.querySelector("#galeria")
const estado = document.querySelector("#estado")
const relleno = document.querySelector("#relleno")
const textoProgreso = document.querySelector("#textoprogreso")
const reloj = document.querySelector("#reloj")

// Cuántos núcleos tiene este ordenador
textoNucleos.textContent = "(tu equipo tiene " + navigator.hardwareConcurrency + " núcleos)"

// Aquí guardo las fotos cargadas: nombre, imagen y su lienzo
let fotos = []

// Estado del trabajo en marcha
let trabajadores = []     // los workers que estoy usando
let cola = []             // posiciones de las fotos que aún no se han enviado
let listas = 0            // fotos que ya han vuelto filtradas
let inicioTrabajo = 0
let nombreFiltroActual = ""
let repeticionesActuales = 1


// ---------------------------------------------
// Barra de progreso: "7 de 17 fotos listas"
// ---------------------------------------------
function mostrarProgreso(){
  let porcentaje = fotos.length == 0 ? 0 : (listas / fotos.length) * 100
  relleno.style.width = porcentaje + "%"
  textoProgreso.textContent = listas + " de " + fotos.length + " fotos listas"
}


// ---------------------------------------------
// Reloj de prueba: se actualiza cada 100 ms.
// No se para mientras los workers trabajan.
// ---------------------------------------------
let inicioReloj = performance.now()

setInterval(function(){
  let segundos = (performance.now() - inicioReloj) / 1000
  reloj.textContent = "Reloj de prueba: " + segundos.toFixed(1) + " s"
}, 100)


// ---------------------------------------------
// 1. Al elegir fotos, las cargo y creo una tarjeta por cada una
// ---------------------------------------------
entrada.onchange = function(){

  fotos = []
  galeria.innerHTML = ""
  botonAplicar.disabled = true
  listas = 0

  let archivos = Array.from(entrada.files)
  if(archivos.length == 0){ return }

  let cargadas = 0

  archivos.forEach(function(archivo, posicion){

    let imagen = new Image()
    imagen.src = URL.createObjectURL(archivo)

    imagen.onload = function(){

      // Tarjeta con su lienzo y su nombre
      let tarjeta = document.createElement("figure")
      let lienzo = document.createElement("canvas")
      let nombre = document.createElement("figcaption")

      lienzo.width = imagen.width
      lienzo.height = imagen.height
      lienzo.getContext("2d").drawImage(imagen,0,0)
      nombre.textContent = archivo.name

      tarjeta.appendChild(lienzo)
      tarjeta.appendChild(nombre)

      // Guardo cada foto en su posición para mantener el orden
      fotos[posicion] = {
        nombre: archivo.name,
        imagen: imagen,
        lienzo: lienzo,
        tarjeta: tarjeta
      }

      cargadas++

      // Cuando han cargado todas, las muestro
      if(cargadas == archivos.length){
        fotos.forEach(function(foto){
          galeria.appendChild(foto.tarjeta)
        })
        botonAplicar.disabled = false
        estado.textContent = fotos.length + " fotos cargadas"
        mostrarProgreso()
      }
    }
  })
}


// ---------------------------------------------
// 2. Envío la siguiente foto de la cola a un worker que está libre
// ---------------------------------------------
function enviarSiguiente(trabajador){

  // Si no quedan fotos en la cola, este worker ya no tiene nada que hacer
  if(cola.length == 0){ return }

  let i = cola.shift()   // saco la primera foto de la cola
  let foto = fotos[i]
  foto.tarjeta.className = "procesando"

  let contexto = foto.lienzo.getContext("2d")
  let ancho = foto.lienzo.width
  let alto = foto.lienzo.height

  // Parto siempre de la foto original
  contexto.drawImage(foto.imagen,0,0)
  let imagenDatos = contexto.getImageData(0,0,ancho,alto)

  // Se la envío al worker (transfiero la memoria para no copiarla)
  trabajador.postMessage({
    indice: i,
    pixeles: imagenDatos.data.buffer,
    ancho: ancho,
    alto: alto,
    filtro: nombreFiltroActual,
    repeticiones: repeticionesActuales
  }, [imagenDatos.data.buffer])
}


// ---------------------------------------------
// 3. Un worker me devuelve una foto ya filtrada
// ---------------------------------------------
function recibirResultado(trabajador, mensaje){

  let respuesta = mensaje.data
  let foto = fotos[respuesta.indice]

  // Reconstruyo la imagen con los píxeles recibidos y la pinto en su tarjeta
  let pixeles = new Uint8ClampedArray(respuesta.pixeles)
  let imagenDatos = new ImageData(pixeles, respuesta.ancho, respuesta.alto)
  foto.lienzo.getContext("2d").putImageData(imagenDatos, 0, 0)

  // La foto está lista: actualizo su tarjeta y el progreso
  foto.tarjeta.className = "lista"
  listas++
  mostrarProgreso()

  // Cumplo la promesa de esta foto (avisa a Promise.all)
  foto.resolver()

  // Este worker ya está libre: le doy otra foto si queda alguna
  enviarSiguiente(trabajador)
}


// Cierro todos los workers cuando ya no hacen falta
function cerrarWorkers(){
  trabajadores.forEach(function(trabajador){
    trabajador.terminate()
  })
  trabajadores = []
}


// ---------------------------------------------
// 4. Al pulsar el botón, creo los workers y reparto las fotos
// ---------------------------------------------
botonAplicar.onclick = function(){

  nombreFiltroActual = selectorFiltro.value
  repeticionesActuales = Math.max(1, parseInt(campoRepeticiones.value) || 1)
  let numeroWorkers = parseInt(selectorWorkers.value)

  botonAplicar.disabled = true
  estado.textContent = "Procesando " + fotos.length + " fotos con " + numeroWorkers + " workers..."

  // Cola con todas las fotos pendientes: 0, 1, 2, 3...
  cola = fotos.map(function(foto, posicion){ return posicion })
  listas = 0
  mostrarProgreso()
  inicioTrabajo = performance.now()

  // Una promesa por foto. Se cumplirá cuando su worker la devuelva.
  let tareas = fotos.map(function(foto){
    foto.tarjeta.className = "pendiente"
    return new Promise(function(resolver){
      foto.resolver = resolver
    })
  })

  // ESPERA: cuando se hayan cumplido TODAS las promesas, el trabajo ha terminado
  Promise.all(tareas).then(function(){
    let total = performance.now() - inicioTrabajo

    estado.textContent =
      fotos.length + " fotos con filtro " + nombreFiltroActual +
      " en " + total.toFixed(0) + " ms con " +
      numeroWorkers + (numeroWorkers == 1 ? " worker" : " workers")

    cerrarWorkers()
    botonAplicar.disabled = false
  })

  // Creo los workers
  try{
    for(let n = 0; n < numeroWorkers; n++){

      let trabajador = new Worker("js/trabajador.js")

      trabajador.onmessage = function(mensaje){
        recibirResultado(trabajador, mensaje)
      }

      trabajador.onerror = function(error){
        estado.textContent = "Error en un worker: " + error.message
        cerrarWorkers()
        botonAplicar.disabled = false
      }

      trabajadores.push(trabajador)
    }
  }catch(error){
    // Pasa, por ejemplo, si abro el HTML con doble clic en vez de usar localhost
    estado.textContent = "No se pudieron crear los workers. Abre la página desde localhost."
    cerrarWorkers()
    botonAplicar.disabled = false
    return
  }

  // Le doy una foto a cada worker para empezar
  trabajadores.forEach(function(trabajador){
    enviarSiguiente(trabajador)
  })
}
