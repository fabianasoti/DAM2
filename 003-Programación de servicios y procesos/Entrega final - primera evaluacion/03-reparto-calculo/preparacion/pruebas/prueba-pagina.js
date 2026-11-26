// Prueba de la página (escena del maestro y panel del esclavo) con un navegador simulado (jsdom)
// contra el servidor PHP real. jsdom solo se usa aquí, no forma parte del proyecto.
// Antes hay que arrancar el servidor, desde esta carpeta:
//   PHP_CLI_SERVER_WORKERS=8 php -S 127.0.0.1:8083 -t ../../proyecto
// Uso: NODE_PATH=<carpeta con node_modules> node prueba-pagina.js     (tarda unos 40 s)
const fs = require("fs")
const vm = require("vm")
const path = require("path")
const { JSDOM, VirtualConsole } = require("jsdom")

const BASE = "http://127.0.0.1:8083/"
const PROYECTO = path.join(__dirname, "..", "..", "proyecto")
let errores = []
const resultados = { ok: 0, fallo: 0 }

function informe(nombre, condicion, detalle) {
  resultados[condicion ? "ok" : "fallo"]++
  console.log((condicion ? "OK    " : "FALLO ") + nombre + (detalle !== undefined ? " -> " + detalle : ""))
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
async function hasta(condicion, ms = 8000) {
  const fin = Date.now() + ms
  while (Date.now() < fin) {
    if (condicion()) return true
    await esperar(50)
  }
  return false
}

// jsdom no tiene Worker: se ejecuta el mismo trabajador.js con un "self" falso
class Worker {
  constructor(ruta) {
    const self = { postMessage: (m) => setTimeout(() => this.onmessage({ data: m })) }
    vm.runInNewContext(fs.readFileSync(path.join(PROYECTO, ruta), "utf8"), { self, parseInt, Number, Math })
    this.self = self
  }
  postMessage(m) { setTimeout(() => this.self.onmessage({ data: m })) }
  terminate() {}
}

async function abrir() {
  const consola = new VirtualConsole()
  consola.on("jsdomError", (e) => errores.push(e.message.slice(0, 150)))
  consola.on("error", (...a) => errores.push(a.join(" ").slice(0, 150)))
  const dom = await JSDOM.fromURL(BASE + "index.html", {
    runScripts: "dangerously", resources: "usable", virtualConsole: consola, pretendToBeVisual: true,
    beforeParse(w) {
      w.fetch = (url, op) => fetch(new URL(url, BASE).href, op)
      w.Worker = Worker
      w.addEventListener("error", (e) => errores.push(e.message))
    }
  })
  if (dom.window.document.readyState !== "complete") {
    await new Promise((r) => dom.window.addEventListener("load", r))
  }
  return dom
}

// Llama a los PHP como lo haría un esclavo
async function php(archivo, datos) {
  const r = await fetch(BASE + "php/" + archivo, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos || {}) })
  return r.json()
}
function calcular(paquete) {
  let resultado = null
  const self = { postMessage: (m) => { if (m.tipo === "resultado") resultado = m.resultado } }
  vm.runInNewContext(fs.readFileSync(path.join(PROYECTO, "js/trabajador.js"), "utf8"), { self, parseInt, Number, Math })
  self.onmessage({ data: { datos: paquete.datos, carga: 0 } })
  return resultado
}

async function pruebas() {
  await php("reiniciar.php")
  const maestro = await abrir()
  const d = maestro.window.document
  const $ = (s) => d.querySelector(s)
  const contar = (s) => d.querySelectorAll(s).length

  // El candado se enciende un momento: se apunta cada vez que ocurre
  let candadoEncendido = 0
  new maestro.window.MutationObserver(() => { if ($("#candado").classList.contains("cerrado")) candadoEncendido++ })
    .observe($("#candado"), { attributes: true })

  $("#botonMaestro").click()
  $("#tamano").value = "100"
  $("#carga").value = "0"
  $("#preparar").click()
  informe("al preparar, las 24 fichas están en el montón de pendientes", await hasta(() => contar("#monton .ficha.p") === 24), contar("#monton .ficha"))
  informe("sin esclavos se muestra la indicación", !$("#sinMesas").classList.contains("oculto"))

  const a = await php("trabajo.php", { esclavo: "esclavo-aaaa" })
  const b = await php("trabajo.php", { esclavo: "esclavo-bbbb" })
  informe("dos esclavos cogen paquete: aparecen dos mesas con su ficha", await hasta(() => contar(".mesa .ficha.a") === 2), contar(".mesa") + " mesas")
  informe("cada mesa lleva el código de su esclavo", [...d.querySelectorAll(".mesa strong")].map((e) => e.textContent).sort().join() === "Esclavo aaaa,Esclavo bbbb")
  informe("quedan 22 fichas pendientes", contar("#monton .ficha") === 22)
  informe("el candado se encendió al coger paquetes", candadoEncendido > 0, candadoEncendido + " veces")

  await php("recepcion.php", { id: a.id, esclavo: "esclavo-aaaa", resultado: calcular(a), segundos: 0 })
  informe("al entregar, la ficha pasa a terminados", await hasta(() => contar("#hechos .ficha.t") === 1))
  informe("aparecen las barras de ingresos por tienda", contar(".fila-tienda") === 5 && /€/.test($(".fila-tienda .importe").textContent), contar(".fila-tienda") + " tiendas")
  informe("la mesa del que entregó queda sin paquete", [...d.querySelectorAll(".mesa small")].some((e) => e.textContent === "Sin paquete. Terminados: 1"))

  // El esclavo bbbb no entrega nunca
  informe("a los 8 s sin entregar, su mesa se pone en rojo con cuenta atrás",
    await hasta(() => contar(".mesa.perdida") === 1, 14000) && /No responde.*en \d+ s/.test($(".mesa.perdida small").textContent), $(".mesa.perdida small") && $(".mesa.perdida small").textContent)
  informe("pasado el tiempo máximo avisa de que se puede reasignar",
    await hasta(() => $(".mesa.perdida small") && $(".mesa.perdida small").textContent.startsWith("Paquete perdido"), 30000))

  // Otro esclavo (una ventana de verdad de la página) hace todo lo que queda, incluido el perdido
  const esclavo = await abrir()
  const de = esclavo.window.document
  de.querySelector("#botonEsclavo").click()
  informe("la ventana de esclavo dice su código", /^Esta ventana es: Esclavo .{4}$/.test(de.querySelector("#identidad").textContent), de.querySelector("#identidad").textContent)
  informe("todas las fichas acaban en terminados", await hasta(() => contar("#hechos .ficha.t") === 24, 30000), contar("#hechos .ficha"))
  informe("el paquete perdido se reasignó: ya no hay mesas en rojo ni fichas en marcha", contar(".mesa.perdida") === 0 && contar(".ficha.a") === 0)
  informe("la suma de los esclavos coincide con la del archivo", await hasta(() => $("#comprobacion").textContent.startsWith("Comprobado")), $("#comprobacion").textContent)
  informe("muestra el producto más vendido", $("#masVendido").textContent.startsWith("Más vendido"), $("#masVendido").textContent)

  $("#reiniciar").click()
  informe("al reiniciar se vacía la escena", await hasta(() => contar(".ficha") === 0 && contar(".mesa") === 0 && contar(".fila-tienda") === 0))
  $("#preparar").click()
  informe("se puede preparar otro trabajo después", await hasta(() => contar("#monton .ficha.p") === 24))
  await php("reiniciar.php")
  informe("ningún error de JavaScript", errores.length === 0, errores.slice(0, 3).join(" | "))
  console.log("\nResumen: " + resultados.ok + " correctas, " + resultados.fallo + " con fallo")
  process.exit(resultados.fallo ? 1 : 0)
}

pruebas().catch((e) => { console.error("FALLO GENERAL", e); process.exit(1) })
