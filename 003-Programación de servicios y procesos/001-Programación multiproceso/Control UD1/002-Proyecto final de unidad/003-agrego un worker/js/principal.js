// Incremental 003: el filtrado lo hace un worker, la página no se congela.
// La página envía las fotos al worker con postMessage y recibe los resultados con onmessage.

const entrada = document.querySelector("#entrada")
const selectorFiltro = document.querySelector("#filtro")
const campoRepeticiones = document.querySelector("#repeticiones")
const botonAplicar = document.querySelector("#aplicar")
const galeria = document.querySelector("#galeria")
const estado = document.querySelector("#estado")
const reloj = document.querySelector("#reloj")

// Aquí guardo las fotos cargadas: nombre, imagen y su lienzo
let fotos = []

// Para controlar cuántas fotos faltan por volver del worker
let pendientes = 0
let inicioTrabajo = 0
let nombreFiltroActual = ""


// ---------------------------------------------
// Reloj de prueba: se actualiza cada 100 ms.
// Ahora NO se para mientras el worker trabaja.
// ---------------------------------------------
let inicioReloj = performance.now()

setInterval(function(){
  let segundos = (performance.now() - inicioReloj) / 1000
  reloj.textContent = "Reloj de prueba: " + segundos.toFixed(1) + " s"
}, 100)


// ---------------------------------------------
// Creo el worker (un hilo aparte que filtra las fotos)
// ---------------------------------------------
let trabajador = null

try{
  trabajador = new Worker("js/trabajador.js")
}catch(error){
  // Pasa, por ejemplo, si abro el HTML con doble clic en vez de usar localhost
  estado.textContent = "No se pudo crear el worker. Abre la página desde localhost."
  botonAplicar.disabled = true
}

if(trabajador){

  // El worker me devuelve una foto ya filtrada
  trabajador.onmessage = function(mensaje){

    let respuesta = mensaje.data
    let foto = fotos[respuesta.indice]

    // Reconstruyo la imagen con los píxeles recibidos y la pinto en su tarjeta
    let pixeles = new Uint8ClampedArray(respuesta.pixeles)
    let imagenDatos = new ImageData(pixeles, respuesta.ancho, respuesta.alto)
    foto.lienzo.getContext("2d").putImageData(imagenDatos, 0, 0)

    pendientes--

    // Cuando han vuelto todas, muestro el tiempo total
    if(pendientes == 0){
      let total = performance.now() - inicioTrabajo
      let porFoto = total / fotos.length

      estado.textContent =
        fotos.length + " fotos con filtro " + nombreFiltroActual +
        " en " + total.toFixed(0) + " ms (" + porFoto.toFixed(1) + " ms por foto)"

      botonAplicar.disabled = false
    }
  }

  // Si el worker falla, lo aviso
  trabajador.onerror = function(error){
    estado.textContent = "Error en el worker: " + error.message
    botonAplicar.disabled = false
  }
}


// ---------------------------------------------
// 1. Al elegir fotos, las cargo y creo una tarjeta por cada una
// ---------------------------------------------
entrada.onchange = function(){

  fotos = []
  galeria.innerHTML = ""
  botonAplicar.disabled = true

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
        botonAplicar.disabled = (trabajador == null)
        estado.textContent = fotos.length + " fotos cargadas"
      }
    }
  })
}


// ---------------------------------------------
// 2. Al pulsar el botón, envío todas las fotos al worker
//    Esta función termina enseguida: el trabajo pesado lo hace el worker.
// ---------------------------------------------
botonAplicar.onclick = function(){

  nombreFiltroActual = selectorFiltro.value
  let repeticiones = Math.max(1, parseInt(campoRepeticiones.value) || 1)

  botonAplicar.disabled = true
  estado.textContent = "Procesando " + fotos.length + " fotos..."

  pendientes = fotos.length
  inicioTrabajo = performance.now()

  for(let i = 0; i < fotos.length; i++){

    let foto = fotos[i]
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
      repeticiones: repeticiones
    }, [imagenDatos.data.buffer])
  }
}
