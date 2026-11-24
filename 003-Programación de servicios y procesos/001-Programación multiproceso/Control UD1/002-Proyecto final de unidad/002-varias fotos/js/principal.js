// Incremental 002: varias fotos, una detrás de otra, sin paralelismo.
// Mientras el bucle trabaja, la página se queda congelada (el reloj se para).

const entrada = document.querySelector("#entrada")
const selectorFiltro = document.querySelector("#filtro")
const campoRepeticiones = document.querySelector("#repeticiones")
const botonAplicar = document.querySelector("#aplicar")
const galeria = document.querySelector("#galeria")
const estado = document.querySelector("#estado")
const reloj = document.querySelector("#reloj")

// Aquí guardo las fotos cargadas: nombre, imagen y su lienzo
let fotos = []


// ---------------------------------------------
// Reloj de prueba: se actualiza cada 100 ms.
// Si el hilo principal está ocupado, no se actualiza.
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
      }
    }
  })
}


// ---------------------------------------------
// 2. Filtra UNA foto (se repite el filtro las veces que se pida)
// ---------------------------------------------
function procesarFoto(foto, nombreFiltro, repeticiones){

  let contexto = foto.lienzo.getContext("2d")
  let ancho = foto.lienzo.width
  let alto = foto.lienzo.height

  // Parto siempre de la foto original
  contexto.drawImage(foto.imagen,0,0)

  let imagenDatos
  for(let i = 0; i < repeticiones; i++){
    imagenDatos = contexto.getImageData(0,0,ancho,alto)
    aplicarFiltro(nombreFiltro, imagenDatos.data)
  }

  contexto.putImageData(imagenDatos,0,0)
}


// ---------------------------------------------
// 3. Al pulsar el botón, filtro todas las fotos una detrás de otra
// ---------------------------------------------
botonAplicar.onclick = function(){

  let nombreFiltro = selectorFiltro.value
  let repeticiones = parseInt(campoRepeticiones.value) || 1

  let inicio = performance.now()

  for(let i = 0; i < fotos.length; i++){
    procesarFoto(fotos[i], nombreFiltro, repeticiones)
  }

  let total = performance.now() - inicio
  let porFoto = total / fotos.length

  estado.textContent =
    fotos.length + " fotos con filtro " + nombreFiltro +
    " en " + total.toFixed(0) + " ms (" + porFoto.toFixed(1) + " ms por foto)"
}
