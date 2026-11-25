// Prueba de humo de js/chat.js con un navegador simulado (Node 22 trae WebSocket)
// Antes hay que arrancar el servidor y una IA simulada, desde la carpeta proyecto:
//   python3 servidor.py   y   python3 ia.py --simulada
const fs = require("fs")
const vm = require("vm")
const path = require("path")

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "../../proyecto/configuracion.json"), "utf8"))
const elementos = {}
function elemento(selector) {
  if (!elementos[selector]) {
    const hijos = []
    elementos[selector] = {
      textContent: "", value: "", disabled: false, className: "", children: hijos, scrollTop: 0, scrollHeight: 0,
      classList: {
        lista: new Set(selector === "#chat" ? ["oculto"] : []),
        add(c) { this.lista.add(c) }, remove(c) { this.lista.delete(c) }, contains(c) { return this.lista.has(c) }
      },
      appendChild(h) { hijos.push(h) }
    }
  }
  return elementos[selector]
}
function crear() {
  const e = { textContent: "", className: "", children: [], classList: { add(c) { e.className += " " + c } },
    appendChild(h) { e.children.push(h) }, remove() { e.quitado = true } }
  return e
}
const contexto = vm.createContext({
  document: { querySelector: elemento, createElement: crear },
  location: { hostname: "127.0.0.1" },
  WebSocket, JSON, console
})
vm.runInContext(fs.readFileSync(path.join(__dirname, "../../proyecto/js/chat.js"), "utf8"), contexto)

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const burbujas = () => elemento("#mensajes").children.filter((b) => !b.quitado)

;(async () => {
  // Entrar sin datos
  elemento("#nombre").value = ""
  elemento("#conectar").onclick()
  console.log("sin nombre ni clave ->", elemento("#aviso").textContent)

  // Entrar con clave mala
  elemento("#nombre").value = "Ana"
  elemento("#clave").value = "mala"
  elemento("#conectar").onclick()
  await esperar(500)
  console.log("clave mala ->", elemento("#aviso").textContent)

  // Entrar bien
  elemento("#clave").value = config.clave_usuarios
  elemento("#conectar").onclick()
  await esperar(500)
  console.log("entrada correcta -> chat visible:", !elemento("#chat").classList.contains("oculto"),
    "| estado:", elemento("#estado").textContent)

  // Preguntar
  elemento("#texto").value = "¿Qué es un worker?"
  elemento("#formulario").onsubmit({ preventDefault() {} })
  console.log("tras enviar, burbujas:", burbujas().map((b) => b.className.trim().replace(/\s+/g, "+")).join(" , "))
  await esperar(2000)
  console.log("tras la respuesta:", burbujas().map((b) => b.className.trim().replace(/\s+/g, "+") + ": " + b.children[0].textContent).join(" | "))
  process.exit(0)
})()
