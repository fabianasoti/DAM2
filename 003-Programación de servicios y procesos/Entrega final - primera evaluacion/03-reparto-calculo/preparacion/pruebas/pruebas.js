// Pruebas del reparto de cálculo. Hace de maestro y de esclavos contra el servidor PHP.
// Antes hay que arrancar el servidor (desde esta carpeta):
//   PHP_CLI_SERVER_WORKERS=8 php -S 127.0.0.1:8083 -t ../../proyecto
// Uso: node pruebas.js concurrencia | negativas | perdido | velocidad
const fs = require("fs")
const vm = require("vm")
const path = require("path")
const { fork } = require("child_process")

const BASE = "http://127.0.0.1:8083/php/"
const RUTA_WORKER = path.join(__dirname, "../../proyecto/js/trabajador.js")

// Llama a un PHP con un JSON
async function llamar(archivo, datos) {
  const r = await fetch(BASE + archivo, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos || {})
  })
  return r.json()
}

// Ejecuta el MISMO trabajador.js de la página, con un "self" falso, y devuelve su resultado
function calcular(paquete) {
  let resultado = null
  const self = { postMessage: function (m) { if (m.tipo === "resultado") resultado = m.resultado } }
  vm.runInNewContext(fs.readFileSync(RUTA_WORKER, "utf8"), { self: self, parseInt: parseInt, Number: Number, Math: Math })
  self.onmessage({ data: { datos: paquete.datos, carga: paquete.carga } })
  return resultado
}

// Un esclavo: pide, calcula y entrega hasta que no queda nada. Devuelve los ids que ha hecho
async function esclavo(nombre) {
  const hechos = []
  while (true) {
    const p = await llamar("trabajo.php", { esclavo: nombre })
    if (!p.trabajo) {
      if (p.espera) { await new Promise(function (r) { setTimeout(r, 300) }); continue }
      return hechos
    }
    const r = await llamar("recepcion.php", { id: p.id, esclavo: nombre, resultado: calcular(p), segundos: 0 })
    if (r.ok) hechos.push(p.id)
  }
}

async function concurrencia() {
  const info = await llamar("preparar.php", { tamano: 5, carga: 0 })
  console.log("Preparado:", JSON.stringify(info))
  const nombres = []
  for (let i = 1; i <= 16; i++) nombres.push("prueba-" + i)

  const listas = await Promise.all(nombres.map(esclavo))
  const todos = [].concat.apply([], listas)
  const unicos = new Set(todos)
  console.log("Esclavos simultáneos:", nombres.length)
  console.log("Paquetes entregados:", todos.length, "| distintos:", unicos.size, "| total preparados:", info.paquetes)
  console.log("Reparto por esclavo:", listas.map(function (l) { return l.length }).join(" "))
  const e = await llamar("estado.php")
  console.log("Estado final: terminados", e.terminados, "de", e.total, "| coincide:", e.coincide,
    "| importe", e.importe_total, "| esperado", e.esperado.importe)
}

async function negativas() {
  await llamar("preparar.php", { tamano: 0, carga: 999999999 })
  let e = await llamar("estado.php")
  console.log("tamano 0 y carga enorme se limitan: paquetes =", e.total, "(480 si tamano 5)")

  console.log("esclavo con nombre no válido:", JSON.stringify(await llamar("trabajo.php", { esclavo: "../mal nombre" })))
  const a = await llamar("trabajo.php", { esclavo: "ana" })
  const res = calcular(a)
  console.log("entrega de otro esclavo:", JSON.stringify(await llamar("recepcion.php", { id: a.id, esclavo: "luis", resultado: res })))
  console.log("entrega con resultado roto:", JSON.stringify(await llamar("recepcion.php", { id: a.id, esclavo: "ana", resultado: { x: 1 } })))
  console.log("entrega de paquete inexistente:", JSON.stringify(await llamar("recepcion.php", { id: 99999, esclavo: "ana", resultado: res })))
  console.log("entrega correcta:", JSON.stringify(await llamar("recepcion.php", { id: a.id, esclavo: "ana", resultado: res })))
  console.log("entrega repetida:", JSON.stringify(await llamar("recepcion.php", { id: a.id, esclavo: "ana", resultado: res })))
  console.log("reiniciar:", JSON.stringify(await llamar("reiniciar.php")))
  e = await llamar("estado.php")
  console.log("tras reiniciar, paquetes =", e.total)
}

// Un esclavo coge un paquete y desaparece; otro debe recibirlo pasado el tiempo máximo (30 s)
async function perdido() {
  await llamar("preparar.php", { tamano: 500, carga: 0 })
  const perdido = await llamar("trabajo.php", { esclavo: "se-cae" })
  console.log("t=0 s: 'se-cae' coge el paquete", perdido.id, "y desaparece")
  const inicio = Date.now()
  const hechos = []
  while (Date.now() - inicio < 45000) {
    const p = await llamar("trabajo.php", { esclavo: "fiable" })
    if (!p.trabajo) {
      if (!p.espera) break
      await new Promise(function (r) { setTimeout(r, 1000) })
      continue
    }
    const r = await llamar("recepcion.php", { id: p.id, esclavo: "fiable", resultado: calcular(p), segundos: 0 })
    hechos.push(p.id + (p.id === perdido.id ? " (el perdido, a los " + Math.round((Date.now() - inicio) / 1000) + " s)" : ""))
    if (!r.ok) console.log("rechazado:", r.error)
  }
  console.log("'fiable' ha hecho los paquetes:", hechos.join(", "))
  const tarde = await llamar("recepcion.php", { id: perdido.id, esclavo: "se-cae", resultado: calcular(perdido) })
  console.log("'se-cae' reaparece y entrega tarde:", JSON.stringify(tarde))
  const e = await llamar("estado.php")
  console.log("Estado final: terminados", e.terminados, "de", e.total, "| coincide:", e.coincide)
}

// Esclavo como proceso aparte (para medir velocidad con varios a la vez)
async function velocidad() {
  const carga = 10000000
  const resultados = []
  for (const n of [1, 2, 4, 8]) {
    await llamar("preparar.php", { tamano: 40, carga: carga })
    const inicio = process.hrtime.bigint()
    await Promise.all(Array.from({ length: n }, function (_, i) {
      return new Promise(function (resolver) {
        const hijo = fork(__filename, ["esclavo", "vel-" + n + "-" + i])
        hijo.on("exit", resolver)
      })
    }))
    const segundos = Number(process.hrtime.bigint() - inicio) / 1e9
    const e = await llamar("estado.php")
    console.log("esclavos=" + n + " tiempo=" + segundos.toFixed(2) + " s paquetes=" + e.terminados + "/" + e.total + " coincide=" + e.coincide)
  }
}

const modo = process.argv[2]
if (modo === "esclavo") {
  esclavo(process.argv[3]).then(function () { process.exit(0) })
} else if (modo === "concurrencia") concurrencia()
else if (modo === "negativas") negativas()
else if (modo === "perdido") perdido()
else if (modo === "velocidad") velocidad()
else console.log("Uso: node pruebas.js concurrencia | negativas | perdido | velocidad")
