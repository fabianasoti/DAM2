// Página del maestro y del esclavo (el mismo archivo para los dos papeles)

// Identificador único de este navegador cuando actúa como esclavo
const esclavoId = "esclavo-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)

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
  temporizador = setInterval(actualizarMaestro, 1000)
}

document.querySelector("#botonEsclavo").onclick = function () {
  panelEsclavo.classList.remove("oculto")
  panelMaestro.classList.add("oculto")
  clearInterval(temporizador)
  document.querySelector("#identidad").textContent = "Identificador: " + esclavoId
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

      // Tablero: un cuadrado por paquete, de un color según su estado
      let html = ""
      for (let i = 0; i < datos.tablero.length; i++) {
        html += '<span class="paquete ' + datos.tablero[i] + '"></span>'
      }
      document.querySelector("#tablero").innerHTML = html

      // Quién ha hecho cuánto
      let esclavos = ""
      for (const nombre in datos.por_esclavo) {
        esclavos += "<li>" + nombre + ": " + datos.por_esclavo[nombre] + " paquetes</li>"
      }
      document.querySelector("#listaEsclavos").innerHTML = esclavos

      mostrarResultado(datos)
    })
}

// Resultado: ingresos por tienda y comprobación
function mostrarResultado(datos) {
  let html = ""
  const tiendas = Object.keys(datos.ingresos).sort(function (a, b) {
    return datos.ingresos[b] - datos.ingresos[a]
  })
  for (let i = 0; i < tiendas.length; i++) {
    html += "<li>" + tiendas[i] + ": " + euros(datos.ingresos[tiendas[i]]) + "</li>"
  }
  document.querySelector("#ingresos").innerHTML = html

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
