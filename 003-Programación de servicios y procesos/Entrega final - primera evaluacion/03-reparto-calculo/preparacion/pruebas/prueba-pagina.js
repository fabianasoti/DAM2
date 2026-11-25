// Prueba de humo de js/principal.js con un navegador simulado, contra el servidor PHP real
// (arrancar antes: PHP_CLI_SERVER_WORKERS=8 php -S 127.0.0.1:8083 -t ../../proyecto)
const fs = require("fs"), vm = require("vm"), path = require("path")
const proy = path.join(__dirname, "../../proyecto")
const BASE = "http://127.0.0.1:8083/"
const els = {}
function el(s) { return els[s] = els[s] || { textContent: "", innerHTML: "", value: "", classList: { remove() {}, add() {} } } }
els["#tamano"] = { value: "100" }; els["#carga"] = { value: "20000" }
class Worker {
  constructor(f) {
    const self = { postMessage: (m) => setImmediate(() => this.onmessage({ data: m })) }
    vm.runInNewContext(fs.readFileSync(path.join(proy, f), "utf8"), { self, parseInt, Number, Math })
    this.self = self
  }
  postMessage(m) { setImmediate(() => this.self.onmessage({ data: m })) }
  terminate() {}
}
const ctx = vm.createContext({
  document: { querySelector: el }, Worker, performance, console, setTimeout, setInterval, clearInterval, clearTimeout,
  fetch: (u, o) => fetch(BASE + u, o), Date, Math, Object, JSON, parseInt, Number
})
vm.runInContext(fs.readFileSync(path.join(proy, "js/principal.js"), "utf8"), ctx)
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  el("#botonMaestro").onclick(); await esperar(300)
  el("#preparar").onclick(); await esperar(500)
  console.log("maestro tras preparar:", el("#mensajeMaestro").textContent, "| total:", el("#mTotal").textContent)
  el("#botonEsclavo").onclick(); await esperar(4000)
  console.log("esclavo: terminados =", el("#eTerminados").textContent, "| mensaje:", el("#mensajeEsclavo").textContent)
  el("#botonMaestro").onclick(); await esperar(1500)
  console.log("maestro: terminados =", el("#mTerminados").textContent, "de", el("#mTotal").textContent)
  console.log("ingresos:", el("#ingresos").innerHTML.replace(/<\/?li>/g, " | "))
  console.log(el("#masVendido").textContent)
  console.log(el("#comprobacion").textContent)
  process.exit(0)
})().catch((e) => { console.error("FALLO", e); process.exit(1) })
