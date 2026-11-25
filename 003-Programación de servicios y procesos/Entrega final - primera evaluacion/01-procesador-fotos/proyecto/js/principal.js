// Procesador de fotos por lotes con workers.
// Permite descargar las fotos filtradas, ver la original al pasar el ratón
// y copiar la tabla de mediciones.

const entrada = document.querySelector("#entrada")
const selectorFiltro = document.querySelector("#filtro")
const campoRepeticiones = document.querySelector("#repeticiones")
const selectorWorkers = document.querySelector("#numworkers")
const textoNucleos = document.querySelector("#nucleos")
const botonAplicar = document.querySelector("#aplicar")
const botonMedir = document.querySelector("#medir")
const botonDescargar = document.querySelector("#descargar")
const tablaResultados = document.querySelector("#resultados")
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


// Activa o desactiva los dos botones a la vez
function bloquearBotones(bloqueados){
  botonAplicar.disabled = bloqueados
  botonMedir.disabled = bloqueados

  // Solo se puede descargar si hay fotos ya filtradas
  let hayResultados = fotos.some(function(foto){ return foto.resultado })
  botonDescargar.disabled = bloqueados || !hayResultados
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
  bloquearBotones(true)
  tablaResultados.innerHTML = ""
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
      tarjeta.title = "Pasa el ratón para ver la original · Clic para descargar"

      // Guardo cada foto en su posición para mantener el orden
      // "resultado" guardará la foto filtrada cuando vuelva del worker
      let foto = {
        nombre: archivo.name,
        imagen: imagen,
        lienzo: lienzo,
        tarjeta: tarjeta,
        resultado: null,
        filtro: ""
      }
      fotos[posicion] = foto

      // Al pasar el ratón por encima, enseño la original; al salir, vuelve la filtrada
      tarjeta.onmouseenter = function(){
        if(foto.resultado){
          lienzo.getContext("2d").drawImage(imagen,0,0)
        }
      }
      tarjeta.onmouseleave = function(){
        if(foto.resultado){
          lienzo.getContext("2d").putImageData(foto.resultado,0,0)
        }
      }

      // Al hacer clic, descargo esa foto
      tarjeta.onclick = function(){
        descargarFoto(foto)
      }

      cargadas++

      // Cuando han cargado todas, las muestro
      if(cargadas == archivos.length){
        fotos.forEach(function(foto){
          galeria.appendChild(foto.tarjeta)
        })
        bloquearBotones(false)
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
  foto.resultado = imagenDatos
  foto.filtro = nombreFiltroActual

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
// 4. Procesa todas las fotos con N workers.
//    Devuelve una promesa que se cumple con el tiempo total (en ms).
// ---------------------------------------------
function procesarFotos(numeroWorkers){

  return new Promise(function(resolverTiempo, rechazar){

    // Cola con todas las fotos pendientes: 0, 1, 2, 3...
    cola = fotos.map(function(foto, posicion){ return posicion })
    listas = 0
    mostrarProgreso()
    let inicio = performance.now()

    // Una promesa por foto. Se cumplirá cuando su worker la devuelva.
    let tareas = fotos.map(function(foto){
      foto.tarjeta.className = "pendiente"
      foto.resultado = null
      return new Promise(function(resolver){
        foto.resolver = resolver
      })
    })

    // ESPERA: cuando se hayan cumplido TODAS las promesas, el trabajo ha terminado
    Promise.all(tareas).then(function(){
      let total = performance.now() - inicio
      cerrarWorkers()
      resolverTiempo(total)
    })

    // Creo los workers
    try{
      for(let n = 0; n < numeroWorkers; n++){

        let trabajador = new Worker("js/trabajador.js")

        trabajador.onmessage = function(mensaje){
          recibirResultado(trabajador, mensaje)
        }

        trabajador.onerror = function(error){
          cerrarWorkers()
          rechazar("Error en un worker: " + error.message)
        }

        trabajadores.push(trabajador)
      }
    }catch(error){
      // Pasa, por ejemplo, si abro el HTML con doble clic en vez de usar localhost
      cerrarWorkers()
      rechazar("No se pudieron crear los workers. Abre la página desde localhost.")
      return
    }

    // Le doy una foto a cada worker para empezar
    trabajadores.forEach(function(trabajador){
      enviarSiguiente(trabajador)
    })
  })
}


// Lee los ajustes elegidos en los controles
function leerAjustes(){
  nombreFiltroActual = selectorFiltro.value
  // Entre 1 y 1000 repeticiones
  repeticionesActuales = Math.min(1000, Math.max(1, parseInt(campoRepeticiones.value) || 1))
  campoRepeticiones.value = repeticionesActuales
}


// ---------------------------------------------
// 5. Botón "Aplicar a todas": una sola vez, con los workers elegidos
// ---------------------------------------------
botonAplicar.onclick = function(){

  leerAjustes()
  let numeroWorkers = parseInt(selectorWorkers.value)

  bloquearBotones(true)
  tablaResultados.innerHTML = ""
  estado.textContent = "Procesando " + fotos.length + " fotos con " + numeroWorkers + " workers..."

  procesarFotos(numeroWorkers).then(function(total){

    estado.textContent =
      fotos.length + " fotos con filtro " + nombreFiltroActual +
      " en " + total.toFixed(0) + " ms con " +
      numeroWorkers + (numeroWorkers == 1 ? " worker" : " workers")

    bloquearBotones(false)

  }).catch(function(mensaje){
    estado.textContent = mensaje
    bloquearBotones(false)
  })
}


// ---------------------------------------------
// 6. Botón "Medir": repite el trabajo con 1, 2, 4 y 8 workers y compara
// ---------------------------------------------
botonMedir.onclick = function(){

  leerAjustes()
  bloquearBotones(true)
  tablaResultados.innerHTML = ""

  let cantidades = [1, 2, 4, 8]
  let resultados = []

  // Hace la prueba número "posicion" y, al acabar, pasa a la siguiente
  function probar(posicion){

    // Ya no quedan pruebas: muestro la tabla
    if(posicion == cantidades.length){
      mostrarTabla(resultados)
      bloquearBotones(false)
      return
    }

    let numero = cantidades[posicion]
    estado.textContent =
      "Prueba " + (posicion + 1) + " de " + cantidades.length + ": " +
      numero + (numero == 1 ? " worker" : " workers") + "..."

    procesarFotos(numero).then(function(total){
      resultados.push({ workers: numero, ms: total })
      probar(posicion + 1)
    }).catch(function(mensaje){
      estado.textContent = mensaje
      bloquearBotones(false)
    })
  }

  probar(0)
}


// Dibuja la tabla con los tiempos, la mejora y la eficiencia
function mostrarTabla(resultados){

  let base = resultados[0].ms   // tiempo con 1 worker

  // Busco la fila más rápida
  let mejor = resultados[0]
  resultados.forEach(function(fila){
    if(fila.ms < mejor.ms){ mejor = fila }
  })

  let html = "<table><tr><th>Workers</th><th>Tiempo (ms)</th><th>Mejora</th><th>Eficiencia</th></tr>"

  resultados.forEach(function(fila){
    let mejora = base / fila.ms
    let eficiencia = (mejora / fila.workers) * 100

    html += "<tr" + (fila == mejor ? " class='mejor'" : "") + ">" +
      "<td>" + fila.workers + "</td>" +
      "<td>" + fila.ms.toFixed(0) + "</td>" +
      "<td>" + mejora.toFixed(2) + "×</td>" +
      "<td>" + eficiencia.toFixed(0) + " %</td>" +
      "</tr>"
  })

  html += "</table>"
  html += "<p><button id='copiar'>Copiar tabla</button></p>"
  tablaResultados.innerHTML = html

  // El botón copia la tabla en formato Markdown (para pegarla en un documento)
  document.querySelector("#copiar").onclick = function(){
    copiarTabla(resultados)
  }

  estado.textContent =
    fotos.length + " fotos, filtro " + nombreFiltroActual + ", " +
    repeticionesActuales + " repeticiones: lo más rápido fue con " +
    mejor.workers + (mejor.workers == 1 ? " worker" : " workers")
}


// ---------------------------------------------
// 7. Descargar fotos
// ---------------------------------------------

// Crea un lienzo aparte con la foto filtrada (así no depende de lo que se vea ahora)
function lienzoDeResultado(foto){
  let lienzo = document.createElement("canvas")
  lienzo.width = foto.resultado.width
  lienzo.height = foto.resultado.height
  lienzo.getContext("2d").putImageData(foto.resultado,0,0)
  return lienzo
}

// Descarga UNA foto filtrada como JPG
function descargarFoto(foto){

  if(!foto.resultado){ return }   // todavía no está filtrada

  lienzoDeResultado(foto).toBlob(function(archivo){

    let enlace = document.createElement("a")
    enlace.href = URL.createObjectURL(archivo)

    // Nombre: foto original sin extensión + filtro. Ej: "playa-sepia.jpg"
    let sinExtension = foto.nombre.replace(/\.[^.]+$/, "")
    enlace.download = sinExtension + "-" + foto.filtro + ".jpg"

    enlace.click()
    URL.revokeObjectURL(enlace.href)

  }, "image/jpeg", 0.92)
}

// Descarga todas las fotos filtradas, una cada 300 ms
// (Chrome puede preguntar si permites descargar varios archivos)
botonDescargar.onclick = function(){

  let filtradas = fotos.filter(function(foto){ return foto.resultado })

  filtradas.forEach(function(foto, posicion){
    setTimeout(function(){
      descargarFoto(foto)
    }, posicion * 300)
  })

  estado.textContent = "Descargando " + filtradas.length + " fotos..."
}


// ---------------------------------------------
// 8. Copiar la tabla de mediciones en formato Markdown
// ---------------------------------------------
function copiarTabla(resultados){

  let base = resultados[0].ms

  let texto =
    fotos.length + " fotos, filtro " + nombreFiltroActual + ", " +
    repeticionesActuales + " repeticiones\n\n" +
    "| Workers | Tiempo (ms) | Mejora | Eficiencia |\n" +
    "|---|---|---|---|\n"

  resultados.forEach(function(fila){
    let mejora = base / fila.ms
    let eficiencia = (mejora / fila.workers) * 100
    texto += "| " + fila.workers + " | " + fila.ms.toFixed(0) + " | " +
      mejora.toFixed(2) + "× | " + eficiencia.toFixed(0) + " % |\n"
  })

  navigator.clipboard.writeText(texto).then(function(){
    estado.textContent = "Tabla copiada al portapapeles"
  }).catch(function(){
    estado.textContent = "No se pudo copiar la tabla"
  })
}
