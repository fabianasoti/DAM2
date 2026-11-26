// Página del maestro y del esclavo (el mismo archivo para los dos papeles)

// Identificador único de este navegador cuando actúa como esclavo
const esclavoId = "esclavo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)

// Código corto (4 últimos caracteres) para reconocer cada ventana en la pantalla del maestro
function codigo(id) {
  return "Esclavo " + id.slice(-4)
}

let temporizador = null   // actualiza el panel del maestro
let trabajador = null     // el worker del esclavo
let terminados = 0
let trabajando = false    // el esclavo está en marcha

const panelMaestro = document.querySelector("#panelMaestro")
const panelEsclavo = document.querySelector("#panelEsclavo")

// ---------- Elegir papel ----------
document.querySelector("#botonMaestro").onclick = function () {
  panelMaestro.classList.remove("oculto")
  panelEsclavo.classList.add("oculto")
  pararEsclavo()
  actualizarMaestro()
  clearInterval(temporizador)
  temporizador = setInterval(actualizarMaestro, 500)
}

document.querySelector("#botonEsclavo").onclick = function () {
  panelEsclavo.classList.remove("oculto")
  panelMaestro.classList.add("oculto")
  clearInterval(temporizador)
  document.querySelector("#identidad").textContent = "Esta ventana es: " + codigo(esclavoId)
  trabajando = true
  trabajador = new Worker("js/trabajador.js")
  trabajador.onmessage = alRecibirDelWorker
  pedirTrabajo()
}

function pararEsclavo() {
  trabajando = false
  if (trabajador) {
    trabajador.terminate()
    trabajador = null
  }
}

// ---------- Maestro ----------
document.querySelector("#preparar").onclick = function () {
  const tamano = parseInt(document.querySelector("#tamano").value) || 40
  const carga = parseInt(document.querySelector("#carga").value) || 0

  enviar("php/preparar.php", { tamano: tamano, carga: carga }, function (datos) {
    document.querySelector("#mensajeMaestro").textContent = datos.ok
      ? datos.filas + " ventas en " + datos.paquetes + " paquetes de " + datos.tamano
      : datos.error
    actualizarMaestro()
  })
}

document.querySelector("#reiniciar").onclick = function () {
  enviar("php/reiniciar.php", {}, function () {
    document.querySelector("#mensajeMaestro").textContent = "Cola reiniciada"
    actualizarMaestro()
  })
}

// ---------- La escena: cada paquete es una ficha que se mueve de zona ----------
let fichas = {}          // id del paquete -> su ficha
let mesas = {}           // id del esclavo -> su mesa
let trabajoActual = ""   // para saber si el maestro ha preparado un trabajo nuevo
let asignadas = {}       // paquetes que ya estaban en una mesa (para encender el candado)

// A partir de estos segundos sin entregar, se avisa de que el esclavo no responde
const AVISO_LENTO = 8

// Mueve una ficha a otra zona deslizándola: se mide dónde estaba, se cambia de sitio
// y se anima desde la posición antigua hasta la nueva
function mover(ficha, destino) {
  if (ficha.parentNode === destino) return
  const antes = ficha.getBoundingClientRect()
  const estabaEnPantalla = ficha.parentNode !== null
  destino.appendChild(ficha)
  if (!estabaEnPantalla) return

  const despues = ficha.getBoundingClientRect()
  ficha.style.transition = "none"
  ficha.style.transform = "translate(" + (antes.left - despues.left) + "px, " + (antes.top - despues.top) + "px)"
  ficha.getBoundingClientRect()    // obliga al navegador a colocarla antes de animar
  ficha.style.transition = "transform 0.6s"
  ficha.style.transform = ""
}

function limpiarEscena() {
  fichas = {}
  mesas = {}
  asignadas = {}
  document.querySelector("#monton").innerHTML = ""
  document.querySelector("#hechos").innerHTML = ""
  document.querySelector("#mesas").innerHTML = ""
}

// La mesa de un esclavo: su nombre, el paquete que tiene y cuántos ha hecho
function buscarMesa(id) {
  if (!mesas[id]) {
    const caja = document.createElement("div")
    caja.className = "mesa"
    const nombre = document.createElement("strong")
    nombre.textContent = codigo(id)
    const hueco = document.createElement("div")
    hueco.className = "hueco"
    const nota = document.createElement("small")
    caja.append(nombre, hueco, nota)
    document.querySelector("#mesas").appendChild(caja)
    mesas[id] = { caja: caja, hueco: hueco, nota: nota }
  }
  return mesas[id]
}

function pintarEscena(datos) {
  const trabajo = datos.preparado + "-" + datos.total
  if (trabajo !== trabajoActual) {
    limpiarEscena()
    trabajoActual = trabajo
  }

  // Qué paquetes están en alguna mesa ahora mismo
  const enMesa = {}
  datos.en_marcha.forEach(function (p) { enMesa[p.id] = p })

  // Cada paquete va a su zona
  for (let i = 0; i < datos.tablero.length; i++) {
    const id = i + 1
    if (!fichas[id]) {
      fichas[id] = document.createElement("span")
      fichas[id].textContent = id
    }
    const ficha = fichas[id]
    const estado = datos.tablero[i]
    ficha.className = "ficha " + estado

    if (estado === "p") {
      mover(ficha, document.querySelector("#monton"))
    } else if (estado === "t") {
      mover(ficha, document.querySelector("#hechos"))
    } else {
      mover(ficha, buscarMesa(enMesa[id].esclavo).hueco)
    }
  }

  // Candado: parpadea cuando algún esclavo acaba de coger un paquete nuevo
  const nuevas = datos.en_marcha.filter(function (p) { return asignadas[p.id] !== p.esclavo })
  asignadas = {}
  datos.en_marcha.forEach(function (p) { asignadas[p.id] = p.esclavo })
  if (nuevas.length > 0) {
    encenderCandado()
  }

  // Mesas: crea las de quienes han terminado algo y escribe la nota de cada una
  Object.keys(datos.por_esclavo).forEach(buscarMesa)
  Object.keys(mesas).forEach(function (id) {
    const mesa = mesas[id]
    const suyo = datos.en_marcha.find(function (p) { return p.esclavo === id })
    const hechos = datos.por_esclavo[id] || 0
    mesa.caja.classList.remove("perdida")

    if (suyo && suyo.segundos >= AVISO_LENTO) {
      // Lleva demasiado: puede que se haya cerrado la ventana
      mesa.caja.classList.add("perdida")
      const faltan = datos.tiempo_maximo - suyo.segundos
      mesa.nota.textContent = faltan > 0
        ? "No responde. Su paquete se podrá dar a otro en " + faltan + " s"
        : "Paquete perdido: se lo quedará el próximo esclavo que pida trabajo"
    } else if (suyo) {
      mesa.nota.textContent = "Calculando. Terminados: " + hechos
    } else {
      mesa.nota.textContent = "Sin paquete. Terminados: " + hechos
    }
  })
  document.querySelector("#sinMesas").classList.toggle("oculto", Object.keys(mesas).length > 0)
}

let apagarCandado = null
function encenderCandado() {
  const candado = document.querySelector("#candado")
  candado.classList.add("cerrado")
  clearTimeout(apagarCandado)
  apagarCandado = setTimeout(function () { candado.classList.remove("cerrado") }, 350)
}

// Pregunta al servidor cómo va todo y lo pinta
function actualizarMaestro() {
  fetch("php/estado.php")
    .then(function (r) { return r.json() })
    .then(function (datos) {
      document.querySelector("#mTotal").textContent = datos.total
      document.querySelector("#mPendientes").textContent = datos.pendientes
      document.querySelector("#mAsignados").textContent = datos.asignados
      document.querySelector("#mTerminados").textContent = datos.terminados
      document.querySelector("#mSegundos").textContent = datos.segundos

      pintarEscena(datos)
      mostrarResultado(datos)
    })
}

// Resultado: una barra por tienda, que crece según llegan los paquetes
let barras = {}    // tienda -> sus elementos

function mostrarResultado(datos) {
  const zona = document.querySelector("#ingresos")
  const tiendas = Object.keys(datos.ingresos).sort()
  if (tiendas.length === 0) {
    zona.innerHTML = ""
    barras = {}
  }

  // La barra más larga es la de la tienda que debería llegar más lejos (una parte del total esperado)
  const referencia = datos.esperado ? datos.esperado.importe / 4 : 1

  tiendas.forEach(function (tienda) {
    if (!barras[tienda]) {
      const fila = document.createElement("div")
      fila.className = "fila-tienda"
      const nombre = document.createElement("span")
      nombre.textContent = tienda
      const barra = document.createElement("div")
      barra.className = "barra"
      const relleno = document.createElement("div")
      barra.appendChild(relleno)
      const importe = document.createElement("span")
      importe.className = "importe"
      fila.append(nombre, barra, importe)
      zona.appendChild(fila)
      barras[tienda] = { relleno: relleno, importe: importe }
    }
    barras[tienda].relleno.style.width = Math.min(100, datos.ingresos[tienda] / referencia * 100) + "%"
    barras[tienda].importe.textContent = euros(datos.ingresos[tienda])
  })

  // Producto más vendido
  let mejor = null
  for (const producto in datos.unidades) {
    if (mejor === null || datos.unidades[producto] > datos.unidades[mejor]) {
      mejor = producto
    }
  }
  document.querySelector("#masVendido").textContent =
    mejor === null ? "" : "Más vendido: " + mejor + " (" + datos.unidades[mejor] + " unidades)"

  // Comprobación contra la suma directa del CSV (solo cuando ha terminado)
  const comprobacion = document.querySelector("#comprobacion")
  if (datos.coincide === true) {
    comprobacion.textContent = "Comprobado: la suma de los esclavos (" + euros(datos.importe_total) +
      ") coincide con la suma directa del archivo."
  } else if (datos.coincide === false) {
    comprobacion.textContent = "Atención: no coincide. Esclavos: " + euros(datos.importe_total) +
      ", archivo: " + euros(datos.esperado.importe)
  } else {
    comprobacion.textContent = ""
  }
}

// Convierte céntimos en euros
function euros(centimos) {
  return (centimos / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

// ---------- Esclavo ----------
function pedirTrabajo() {
  if (!trabajando) return

  enviar("php/trabajo.php", { esclavo: esclavoId }, function (datos) {
    if (datos.trabajo) {
      document.querySelector("#ePaquete").textContent = datos.id
      document.querySelector("#mensajeEsclavo").textContent = "Calculando el paquete " + datos.id + "..."
      document.querySelector("#progreso").value = 0
      inicioPaquete = performance.now()
      paqueteActual = datos.id
      trabajador.postMessage({ datos: datos.datos, carga: datos.carga })
    } else {
      document.querySelector("#mensajeEsclavo").textContent = datos.mensaje
      document.querySelector("#ePaquete").textContent = "-"
      // Si aún quedan paquetes de otros, volvemos a preguntar en unos segundos
      if (datos.espera) {
        setTimeout(pedirTrabajo, 2000)
      }
    }
  })
}

let inicioPaquete = 0
let paqueteActual = 0

// El worker nos manda el progreso y, al final, el resultado
function alRecibirDelWorker(evento) {
  const mensaje = evento.data

  if (mensaje.tipo === "progreso") {
    document.querySelector("#progreso").value = mensaje.valor
  }

  if (mensaje.tipo === "resultado") {
    const segundos = (performance.now() - inicioPaquete) / 1000
    enviar("php/recepcion.php", {
      id: paqueteActual,
      esclavo: esclavoId,
      resultado: mensaje.resultado,
      segundos: segundos
    }, function (datos) {
      if (datos.ok) {
        terminados++
        document.querySelector("#eTerminados").textContent = terminados
        document.querySelector("#eTiempo").textContent = segundos.toFixed(2) + " s"
      } else {
        document.querySelector("#mensajeEsclavo").textContent = "El servidor rechazó el resultado: " + datos.error
      }
      pedirTrabajo()
    })
  }
}

// ---------- Enviar datos al servidor ----------
// Si falla la conexión avisa y vuelve a intentarlo
function enviar(url, datos, cuandoLlegue) {
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
    .then(function (r) { return r.json() })
    .then(cuandoLlegue)
    .catch(function () {
      document.querySelector("#mensajeEsclavo").textContent = "Sin conexión con el servidor, reintento..."
      if (trabajando) setTimeout(function () { enviar(url, datos, cuandoLlegue) }, 3000)
    })
}
