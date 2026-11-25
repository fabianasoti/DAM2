// Hilo principal: dibuja las hormigas y reparte el cálculo entre los workers

const ANCHO = 1000
const ALTO = 600

const lienzo = document.querySelector("#lienzo")
lienzo.width = ANCHO
lienzo.height = ALTO
const contexto = lienzo.getContext("2d")

// Controles de la página
const campoHormigas = document.querySelector("#hormigas")
const campoCarga = document.querySelector("#carga")
const campoWorkers = document.querySelector("#workers")
const textoHormigas = document.querySelector("#textoHormigas")
const textoCarga = document.querySelector("#textoCarga")
const textoWorkers = document.querySelector("#textoWorkers")
const textoModo = document.querySelector("#modo")
const textoFps = document.querySelector("#fps")
const textoMs = document.querySelector("#ms")
const botonMedir = document.querySelector("#medir")
const zonaTabla = document.querySelector("#tabla")

// Estado de la simulación
let todas              // todas las hormigas (4 números por hormiga)
let trabajadores = []  // los workers activos
let pendientes = 0     // workers que aún no han contestado en este fotograma
let inicioCalculo = 0
let carga = 1000

// Contadores para medir
let framesTotales = 0
let msTotal = 0
let framesSegundo = 0
let msSegundo = 0
let ultimoSegundo = performance.now()

// Para el botón de medir
let midiendo = false
let resultados = []
const CONFIGURACIONES = [0, 1, 2, 4, 8]

// Convierte el valor de un control en un número dentro de unos límites
function limitar(valor, minimo, maximo, porDefecto) {
  const numero = Number(valor)
  if (Number.isNaN(numero)) return porDefecto
  return Math.min(maximo, Math.max(minimo, Math.round(numero)))
}

// Crea las hormigas y reparte los grupos entre los workers
function crear() {
  // Paramos los workers anteriores
  for (let i = 0; i < trabajadores.length; i++) {
    trabajadores[i].terminate()
  }
  trabajadores = []
  pendientes = 0

  const numero = limitar(campoHormigas.value, 10, 3000, 1000)
  const numeroWorkers = limitar(campoWorkers.value, 0, 8, 0)
  carga = limitar(campoCarga.value, 0, 20000, 1000)

  textoHormigas.textContent = numero
  textoCarga.textContent = carga
  textoWorkers.textContent = numeroWorkers

  // Cada hormiga: x, y, ángulo y velocidad
  todas = new Float32Array(numero * CAMPOS)
  for (let i = 0; i < numero; i++) {
    todas[i * CAMPOS] = Math.random() * ANCHO
    todas[i * CAMPOS + 1] = Math.random() * ALTO
    todas[i * CAMPOS + 2] = Math.random() * Math.PI * 2
    todas[i * CAMPOS + 3] = 1 + Math.random() * 1.5
  }

  if (numeroWorkers === 0) {
    textoModo.textContent = "Sin workers: el hilo principal hace todo el cálculo"
    return
  }

  textoModo.textContent = numeroWorkers + " workers se reparten el cálculo (unas " +
    Math.ceil(numero / numeroWorkers) + " hormigas cada uno)"

  // Reparto equilibrado: todos llevan las mismas hormigas, salvo el resto
  const base = Math.floor(numero / numeroWorkers)
  const resto = numero % numeroWorkers
  let desde = 0

  for (let w = 0; w < numeroWorkers; w++) {
    const cantidad = base + (w < resto ? 1 : 0)

    const trabajador = new Worker("js/trabajador.js")
    trabajador.desde = desde   // dónde empieza su grupo en el array grande

    // Cada worker recibe una COPIA de su trozo
    trabajador.postMessage({
      tipo: "iniciar",
      datos: todas.slice(desde * CAMPOS, (desde + cantidad) * CAMPOS),
      ancho: ANCHO,
      alto: ALTO
    })

    // Cuando contesta, guardamos sus posiciones nuevas
    trabajador.onmessage = function (evento) {
      todas.set(evento.data.datos, trabajador.desde * CAMPOS)
      pendientes--
      if (pendientes === 0) {
        terminarFotograma()
      }
    }

    trabajadores.push(trabajador)
    desde += cantidad
  }
}

// Se llama en cada fotograma del navegador
function fotograma() {
  requestAnimationFrame(fotograma)

  // Si los workers aún no han terminado el fotograma anterior, esperamos
  if (pendientes > 0) return

  inicioCalculo = performance.now()

  if (trabajadores.length === 0) {
    // Sin workers: calculamos aquí, en el hilo principal
    moverHormigas(todas, 0, todas.length / CAMPOS, carga, ANCHO, ALTO)
    terminarFotograma()
  } else {
    // Con workers: les pedimos que calculen y seguiremos cuando contesten
    pendientes = trabajadores.length
    for (let i = 0; i < trabajadores.length; i++) {
      trabajadores[i].postMessage({ tipo: "calcular", carga: carga })
    }
  }
}

// Ya tenemos todas las posiciones: medimos, dibujamos y contamos
function terminarFotograma() {
  const ms = performance.now() - inicioCalculo
  dibujar()

  framesTotales++
  msTotal += ms
  framesSegundo++
  msSegundo += ms

  // Cada segundo actualizamos los marcadores
  const ahora = performance.now()
  if (ahora - ultimoSegundo >= 1000) {
    textoFps.textContent = Math.round(framesSegundo * 1000 / (ahora - ultimoSegundo))
    textoMs.textContent = (msSegundo / framesSegundo).toFixed(1)
    framesSegundo = 0
    msSegundo = 0
    ultimoSegundo = ahora
  }
}

// Dibuja el hormiguero y las hormigas
function dibujar() {
  // Tierra
  contexto.fillStyle = "#dccdaa"
  contexto.fillRect(0, 0, ANCHO, ALTO)

  // Entrada del hormiguero en el centro
  contexto.fillStyle = "#b39b6d"
  contexto.beginPath()
  contexto.ellipse(ANCHO / 2, ALTO / 2, 80, 50, 0, 0, Math.PI * 2)
  contexto.fill()
  contexto.fillStyle = "#6e5836"
  contexto.beginPath()
  contexto.ellipse(ANCHO / 2, ALTO / 2, 30, 19, 0, 0, Math.PI * 2)
  contexto.fill()

  const radio = 2.5
  const total = todas.length / CAMPOS

  // Cuerpos: cabeza, tórax y abdomen, todos en un único trazo
  contexto.fillStyle = "#2b1d14"
  contexto.beginPath()
  for (let i = 0; i < total; i++) {
    const x = todas[i * CAMPOS]
    const y = todas[i * CAMPOS + 1]
    const c = Math.cos(todas[i * CAMPOS + 2])
    const s = Math.sin(todas[i * CAMPOS + 2])

    contexto.moveTo(x + c * radio * 2.2 + radio * 0.8, y + s * radio * 2.2)
    contexto.arc(x + c * radio * 2.2, y + s * radio * 2.2, radio * 0.8, 0, Math.PI * 2)   // cabeza
    contexto.moveTo(x + radio * 0.9, y)
    contexto.arc(x, y, radio * 0.9, 0, Math.PI * 2)                                      // tórax
    contexto.moveTo(x - c * radio * 2.4 + radio * 1.3, y - s * radio * 2.4)
    contexto.arc(x - c * radio * 2.4, y - s * radio * 2.4, radio * 1.3, 0, Math.PI * 2)   // abdomen
  }
  contexto.fill()

  // Patas: tres pares por hormiga que se balancean, también en un único trazo
  contexto.strokeStyle = "#2b1d14"
  contexto.lineWidth = 0.8
  contexto.beginPath()
  const tiempo = performance.now() * 0.02
  for (let i = 0; i < total; i++) {
    const x = todas[i * CAMPOS]
    const y = todas[i * CAMPOS + 1]
    const c = Math.cos(todas[i * CAMPOS + 2])
    const s = Math.sin(todas[i * CAMPOS + 2])

    for (let par = -1; par <= 1; par++) {
      const px = x + c * par * radio
      const py = y + s * par * radio
      const balanceo = Math.sin(tiempo + i + par * 2) * 1.8
      // Pata izquierda y pata derecha (perpendiculares al cuerpo)
      contexto.moveTo(px, py)
      contexto.lineTo(px - s * radio * 2.4 + c * balanceo, py + c * radio * 2.4 + s * balanceo)
      contexto.moveTo(px, py)
      contexto.lineTo(px + s * radio * 2.4 + c * balanceo, py - c * radio * 2.4 + s * balanceo)
    }
  }
  contexto.stroke()
}

// ---------- Botón de medir ----------
// Prueba varias configuraciones de workers, una detrás de otra, y apunta los FPS

function medir() {
  if (midiendo) return
  midiendo = true
  resultados = []
  botonMedir.disabled = true
  zonaTabla.innerHTML = "<p>Midiendo... deja esta pestaña a la vista.</p>"
  probarConfiguracion(0)
}

function probarConfiguracion(i) {
  if (i >= CONFIGURACIONES.length) {
    midiendo = false
    botonMedir.disabled = false
    mostrarTabla()
    return
  }

  campoWorkers.value = CONFIGURACIONES[i]
  crear()

  // Primero 1 segundo de calentamiento y después 3 segundos midiendo
  setTimeout(function () {
    const framesAntes = framesTotales
    const msAntes = msTotal
    const tiempoAntes = performance.now()

    setTimeout(function () {
      const segundos = (performance.now() - tiempoAntes) / 1000
      const frames = framesTotales - framesAntes
      resultados.push({
        workers: CONFIGURACIONES[i],
        fps: frames / segundos,
        ms: frames > 0 ? (msTotal - msAntes) / frames : 0
      })
      probarConfiguracion(i + 1)
    }, 3000)
  }, 1000)
}

function mostrarTabla() {
  let html = "<table><tr><th>Workers</th><th>FPS</th><th>ms de cálculo</th></tr>"
  for (let i = 0; i < resultados.length; i++) {
    const r = resultados[i]
    html += "<tr><td>" + (r.workers === 0 ? "0 (sin workers)" : r.workers) + "</td>" +
      "<td>" + r.fps.toFixed(1) + "</td><td>" + r.ms.toFixed(1) + "</td></tr>"
  }
  html += "</table><p>" + textoHormigas.textContent + " hormigas, carga " + carga + "</p>"
  zonaTabla.innerHTML = html
}

// ---------- Arranque ----------
campoHormigas.oninput = crear
campoWorkers.oninput = crear
campoCarga.oninput = function () {
  carga = limitar(campoCarga.value, 0, 20000, 1000)
  textoCarga.textContent = carga
}
botonMedir.onclick = medir

crear()
requestAnimationFrame(fotograma)
