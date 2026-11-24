// Incremental 006: mediciones.
// procesarFotos(n) filtra todas las fotos con n workers y DEVUELVE UNA PROMESA
// con el tiempo que ha tardado. Así puedo llamarla varias veces (1, 2, 4 y 8
// workers) y comparar los tiempos en una tabla.

const entrada = document.querySelector("#entrada")
const selectorFiltro = document.querySelector("#filtro")
const campoRepeticiones = document.querySelector("#repeticiones")
const selectorWorkers = document.querySelector("#numworkers")
const textoNucleos = document.querySelector("#nucleos")
const botonAplicar = document.querySelector("#aplicar")
const botonMedir = document.querySelector("#medir")
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
  repeticionesActuales = Math.max(1, parseInt(campoRepeticiones.value) || 1)
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
  tablaResultados.innerHTML = html

  estado.textContent =
    fotos.length + " fotos, filtro " + nombreFiltroActual + ", " +
    repeticionesActuales + " repeticiones: lo más rápido fue con " +
    mejor.workers + (mejor.workers == 1 ? " worker" : " workers")
}
