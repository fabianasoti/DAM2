// Prueba de la interfaz con un navegador simulado (jsdom): carga las páginas desde el servidor PHP real,
// inicia sesión con cada rol, recorre todas las vistas y comprueba que no hay errores de JavaScript.
// jsdom solo hace falta para esta prueba (no forma parte del proyecto):  npm install jsdom
//
// Uso (desde esta carpeta):
//   NODE_PATH=<carpeta con node_modules> SQLITE_EXT=<sqlite3.so, si PHP no lo tiene> node pruebas_interfaz.js
const { JSDOM, CookieJar, VirtualConsole, requestInterceptor } = require("jsdom")
const { spawn } = require("child_process")
const fs = require("fs")
const os = require("os")
const path = require("path")

const ORIGEN = path.join(__dirname, "..", "..", "proyecto")
const PUERTO = 8092
const BASE = "http://127.0.0.1:" + PUERTO + "/"
const CLAVE = "Thistle2026!"
const resultados = { ok: 0, fallo: 0 }
let errores = []    // errores de JavaScript que aparecen en cualquier página

function informe(nombre, condicion, detalle) {
  resultados[condicion ? "ok" : "fallo"]++
  console.log((condicion ? "OK    " : "FALLO ") + nombre + (detalle !== undefined && detalle !== "" ? " -> " + detalle : ""))
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// Espera hasta que se cumpla una condición (o se agote el tiempo)
async function hasta(condicion, ms = 6000) {
  const fin = Date.now() + ms
  while (Date.now() < fin) {
    try { if (condicion()) return true } catch (e) { /* aún no está */ }
    await esperar(40)
  }
  return false
}

// Solo se cargan recursos de nuestro servidor (no las fuentes de Google): lo demás se contesta vacío
const soloLocal = requestInterceptor((peticion) => {
  if (!peticion.url.startsWith(BASE)) return new Response("", { status: 204 })
})

// Abre una página con una sesión (la cookie va en "jar")
async function abrir(ruta, jar) {
  const consola = new VirtualConsole()
  consola.on("jsdomError", (e) => { if (!/navigation|Could not load link/i.test(e.message)) errores.push("jsdom: " + e.message.slice(0, 150)) })
  consola.on("error", (...a) => errores.push("console.error: " + a.join(" ").slice(0, 150)))
  const dom = await JSDOM.fromURL(BASE + ruta, {
    runScripts: "dangerously", resources: { interceptors: [soloLocal] }, pretendToBeVisual: true, cookieJar: jar, virtualConsole: consola,
    beforeParse(window) {
      // jsdom no trae fetch: usamos el de Node, pasando la cookie de sesión
      window.fetch = async (url, opciones = {}) => {
        const absoluta = new URL(url, window.location.href).href
        const cabeceras = Object.assign({}, opciones.headers, { cookie: jar.getCookieStringSync(absoluta) })
        const respuesta = await fetch(absoluta, Object.assign({}, opciones, { headers: cabeceras }))
        for (const c of respuesta.headers.getSetCookie()) jar.setCookieSync(c, absoluta)
        return respuesta
      }
      window.addEventListener("error", (e) => errores.push("error: " + e.message))
      window.addEventListener("unhandledrejection", (e) => errores.push("promesa: " + (e.reason && e.reason.message)))
    }
  })
  // fromURL devuelve la página antes de que terminen de cargarse los scripts: se espera al evento "load"
  if (dom.window.document.readyState !== "complete") {
    await new Promise((resolver) => dom.window.addEventListener("load", resolver))
  }
  return dom
}

async function entrar(email) {
  const jar = new CookieJar()
  const dom = await abrir("login.html", jar)
  const doc = dom.window.document
  doc.querySelector("#email").value = email
  doc.querySelector("#password").value = CLAVE
  doc.querySelector("#formulario").dispatchEvent(new dom.window.Event("submit", { cancelable: true }))
  // El login ha terminado cuando la API reconoce la sesión
  let reconocida = false
  for (let i = 0; i < 100 && !reconocida; i++) {
    const r = await fetch(BASE + "api/sesion.php?accion=yo", { headers: { cookie: jar.getCookieStringSync(BASE) } })
    reconocida = r.status === 200
    if (!reconocida) await esperar(60)
  }
  dom.window.close()
  return jar
}

async function pruebas() {
  // ---------- Página de entrada ----------
  const jarMala = new CookieJar()
  const login = await abrir("login.html", jarMala)
  let doc = login.window.document
  doc.querySelector("#email").value = "sergio.molina@cardomarino.example"
  doc.querySelector("#password").value = "incorrecta"
  doc.querySelector("#formulario").dispatchEvent(new login.window.Event("submit", { cancelable: true }))
  informe("contraseña incorrecta: se muestra el error en pantalla", await hasta(() => doc.querySelector("#mensaje").textContent === "Credenciales incorrectas"), doc.querySelector("#mensaje").textContent)
  doc.querySelector("#email").value = ""
  doc.querySelector("#formulario").dispatchEvent(new login.window.Event("submit", { cancelable: true }))
  informe("campos vacíos: se pide email y contraseña", doc.querySelector("#mensaje").textContent.includes("Escribe tu email"))
  login.window.close()

  // ---------- Cada rol recorre sus vistas ----------
  const roles = [
    ["admin", "lucia.ferrer@cardomarino.example", ["Recepción", "Operaciones", "Informes", "Administración"]],
    ["recepcion", "sergio.molina@cardomarino.example", ["Recepción", "Operaciones", "Informes"]],
    ["mantenimiento", "pablo.navarro@cardomarino.example", ["Operaciones"]],
    ["limpieza", "rosa.delgado@cardomarino.example", ["Operaciones"]],
  ]
  const sesiones = {}
  for (const [rol, email, modulosEsperados] of roles) {
    const jar = await entrar(email)
    sesiones[rol] = jar
    const dom = await abrir("index.html", jar)
    const d = dom.window.document
    await hasta(() => d.querySelector("#nombreUsuario").textContent !== "")
    const modulos = [...d.querySelectorAll("#listaModulos a")].map((a) => a.textContent)
    informe(rol + ": ve solo sus módulos", JSON.stringify(modulos) === JSON.stringify(modulosEsperados), modulos.join(", "))
    informe(rol + ": botón 'Nueva reserva' solo para recepción", d.querySelector("#botonNuevaReserva").classList.contains("oculto") === !["admin", "recepcion"].includes(rol))

    // Recorre todos los módulos y todas las vistas
    const rutas = []
    for (const a of d.querySelectorAll("#listaModulos a")) rutas.push(a.getAttribute("href"))
    const vistasVistas = []
    for (const rutaModulo of rutas) {
      dom.window.location.hash = rutaModulo
      await hasta(() => d.querySelectorAll("#listaVistas a").length > 0)
      await esperar(150)
      const enlaces = [...d.querySelectorAll("#listaVistas a")].map((a) => a.getAttribute("href"))
      for (const enlace of enlaces) {
        const antes = errores.length
        dom.window.location.hash = enlace
        await hasta(() => d.querySelector("#estadoVista").textContent !== "" && !d.querySelector("#escenario").textContent.startsWith("Cargando"), 8000)
        await esperar(150)
        const escenario = d.querySelector("#escenario")
        const texto = escenario.textContent
        const sinError = !texto.includes("No se ha podido cargar") && errores.length === antes
        vistasVistas.push(enlace)
        informe(rol + ": vista " + enlace + " se dibuja sin errores", sinError && texto.length > 20,
          sinError ? d.querySelector("#estadoRegistros").textContent || (escenario.querySelectorAll("svg").length + " gráficas") : texto.slice(0, 120) + " | " + errores.slice(antes).join(" | "))
      }
    }
    dom.window.close()
  }

  // ---------- Recepción: flujo completo de una reserva desde la interfaz ----------
  const jar = sesiones.recepcion
  const dom = await abrir("index.html", jar)
  const w = dom.window
  const d = w.document
  await hasta(() => d.querySelector("#nombreUsuario").textContent !== "")
  w.location.hash = "#recepcion/tablero"
  await hasta(() => d.querySelectorAll(".hab").length === 50)
  informe("el tablero muestra las 50 habitaciones", d.querySelectorAll(".hab").length === 50)
  const chips = [...d.querySelectorAll(".chip strong")].map((e) => parseInt(e.textContent))
  informe("la leyenda suma 50", chips.reduce((a, b) => a + b, 0) === 50, chips.join(" + "))
  d.querySelector(".chip").click()
  informe("pulsar un estado destaca solo esas habitaciones", d.querySelectorAll(".hab.apagada").length === 50 - chips[0])
  d.querySelector(".chip").click()
  informe("el calendario tiene una fila por habitación y 14 días", d.querySelectorAll(".calendario tbody tr").length === 50 && d.querySelectorAll(".calendario thead th").length === 15)
  const anchos = [...d.querySelectorAll(".calendario tbody tr")].map((tr) => [...tr.querySelectorAll("td")].reduce((s, td) => s + (td.colSpan || 1), 0))
  informe("cada fila del calendario ocupa exactamente 14 columnas", anchos.every((n) => n === 14), [...new Set(anchos)].join(","))

  d.querySelector(".hab").click()
  informe("pulsar una habitación abre su panel", await hasta(() => d.querySelector("#panel").classList.contains("abierto")) && d.querySelector("#panelEtiqueta").textContent === "HABITACIÓN")
  d.querySelector("#panelCerrar").click()
  informe("el panel se cierra", !d.querySelector("#panel").classList.contains("abierto"))

  // Nueva reserva pulsando una celda vacía del calendario
  const vacia = d.querySelector(".calendario td.vacia")
  const tituloVacia = vacia.title
  vacia.click()
  informe("una celda vacía abre 'Nueva reserva' con la fecha puesta", await hasta(() => d.querySelector("#panelEtiqueta").textContent === "NUEVA RESERVA")
    && d.querySelector("#panelCuerpo input[type=date]").value.length === 10, tituloVacia)
  await hasta(() => d.querySelectorAll("#panelCuerpo .opcion").length > 0)
  const opciones = d.querySelectorAll("#panelCuerpo .opcion")
  informe("se listan habitaciones disponibles con su precio", opciones.length > 0 && /€/.test(opciones[0].textContent), opciones.length + " opciones")
  const confirmarBoton = [...d.querySelectorAll("#panelPie button")].find((b) => b.textContent === "Confirmar reserva")
  informe("sin elegir habitación y cliente, el botón de confirmar está desactivado", confirmarBoton.disabled)
  // La habitación de la celda pulsada ya aparece elegida; se elige un cliente
  const habElegida = d.querySelector("#panelCuerpo .opcion.elegida")
  const clientes = d.querySelectorAll("#panelCuerpo .opcion:not(:first-child)")
  const lista = [...d.querySelectorAll("#panelCuerpo .opciones")]
  lista[lista.length - 1].querySelector(".opcion").click()
  if (!habElegida) opciones[0].click()
  informe("elegidos habitación y cliente, se puede confirmar", confirmarBoton.disabled === false)
  confirmarBoton.click()
  informe("la reserva se crea y aparece el aviso", await hasta(() => !!d.querySelector(".toast.exito") && /Reserva creada/.test(d.querySelector(".toast.exito").textContent)),
    (d.querySelector(".toast") || {}).textContent)
  await hasta(() => !d.querySelector("#panel").classList.contains("abierto"))
  informe("el panel se cierra al crear", !d.querySelector("#panel").classList.contains("abierto"))

  // Se comprueba contra la API
  await esperar(300)
  const reservas = await (await w.fetch("api/reservas.php?accion=lista&estado=confirmada")).json()
  const ultima = reservas.reservas.sort((a, b) => b.id - a.id)[0]
  informe("la reserva existe en el servidor", ultima && ultima.estado === "confirmada", ultima && ("#" + ultima.id + " hab. " + ultima.habitacion))

  // Cancelarla desde la interfaz (con ventana de confirmación)
  w.location.hash = "#recepcion/reservas"
  await hasta(() => d.querySelectorAll("tbody tr.fila").length > 0)
  const filas = [...d.querySelectorAll("tbody tr.fila")]
  const fila = filas.find((tr) => tr.cells[0].textContent === String(ultima.id))
  informe("la nueva reserva aparece en la lista", !!fila, filas.length + " filas")
  if (fila) {
    fila.click()
    await hasta(() => d.querySelector("#panelEtiqueta").textContent === "RESERVA #" + ultima.id)
    const cancelar = [...d.querySelectorAll("#panelPie button")].find((b) => b.textContent === "Cancelar reserva")
    informe("el detalle ofrece check-in y cancelar", !!cancelar && [...d.querySelectorAll("#panelPie button")].some((b) => b.textContent === "Hacer check-in"))
    cancelar.click()
    informe("cancelar pide confirmación", await hasta(() => d.querySelector("#modal").classList.contains("abierto")))
    ;[...d.querySelectorAll("#modalBotones button")].find((b) => b.textContent === "Cancelar reserva").click()
    await hasta(() => /Reserva cancelada/.test(d.querySelector("#toasts").textContent))
    const cancelada = await (await w.fetch("api/reservas.php?accion=ver&id=" + ultima.id)).json()
    informe("la reserva queda cancelada en el servidor", cancelada.reserva.estado === "cancelada")
  }

  // Filtros de la lista
  w.location.hash = "#recepcion/reservas"
  await hasta(() => d.querySelectorAll("tbody tr.fila").length > 0)
  const selectEstado = d.querySelector(".filtros select")
  selectEstado.value = "check-in"
  selectEstado.dispatchEvent(new w.Event("change"))
  await esperar(600)
  const estados = [...d.querySelectorAll("tbody tr.fila")].map((tr) => tr.cells[6].textContent)
  informe("filtrar por estado muestra solo esas reservas", estados.length > 0 && estados.every((e) => e === "check-in"), estados.length + " reservas")

  // Buscador de la cabecera en una tabla genérica
  w.location.hash = "#recepcion/clientes"
  await hasta(() => d.querySelectorAll("tbody tr.fila").length > 100)
  const buscador = d.querySelector("#buscador")
  const total = d.querySelectorAll("tbody tr.fila").length
  buscador.value = "ZZ0000007"
  buscador.dispatchEvent(new w.Event("input"))
  const visibles = [...d.querySelectorAll("tbody tr.fila")].filter((tr) => !tr.hidden).length
  informe("el buscador filtra las filas de la tabla", visibles >= 1 && visibles < total, visibles + " de " + total)

  // Formulario de cliente: validación en el servidor
  buscador.value = ""
  buscador.dispatchEvent(new w.Event("input"))
  ;[...d.querySelectorAll(".cabecera-vista button")].find((b) => b.textContent === "Nuevo").click()
  await hasta(() => d.querySelector("#panelEtiqueta").textContent === "CREAR")
  ;[...d.querySelectorAll("#panelPie button")].find((b) => b.textContent === "Guardar").click()
  informe("guardar un cliente vacío muestra el motivo en el formulario", await hasta(() => d.querySelector("#panelCuerpo .error-form").textContent.includes("obligatorio")), d.querySelector("#panelCuerpo .error-form").textContent)
  d.querySelector("#panelCerrar").click()

  // Dashboard
  w.location.hash = "#informes/dashboard"
  await hasta(() => d.querySelectorAll(".grafica svg").length >= 4)
  informe("el dashboard dibuja tarjetas y gráficas", d.querySelectorAll(".kpi").length === 9 && d.querySelectorAll(".grafica svg").length === 5, d.querySelectorAll(".kpi").length + " tarjetas, " + d.querySelectorAll(".grafica svg").length + " gráficas")
  const barras = d.querySelector(".grafica").querySelectorAll("svg rect").length
  informe("la gráfica de ocupación tiene 12 barras con su valor", barras === 12 && /%/.test(d.querySelector(".grafica svg rect title").textContent), d.querySelector(".grafica svg rect title").textContent)
  w.close()

  // ---------- Limpieza: resolver un parte desde la interfaz ----------
  const dl = await abrir("index.html", sesiones.limpieza)
  const wl = dl.window
  const dd = wl.document
  await hasta(() => dd.querySelector("#nombreUsuario").textContent !== "")
  wl.location.hash = "#operaciones/limpieza"
  await hasta(() => dd.querySelectorAll("tbody tr").length > 0 && dd.querySelector("tbody button"))
  const antes = dd.querySelectorAll("tbody tr").length
  const resolver = [...dd.querySelectorAll("tbody button")].find((b) => b.textContent === "Resolver")
  informe("limpieza ve sus partes con el botón Resolver", !!resolver, antes + " partes")
  resolver.click()
  informe("al resolver aparece el aviso y la habitación queda disponible", await hasta(() => /Parte resuelto/.test(dd.querySelector("#toasts").textContent) && /disponible/.test(dd.querySelector("#toasts").textContent)), dd.querySelector("#toasts").textContent)
  await hasta(() => dd.querySelectorAll("tbody tr").length === antes - 1)
  informe("el parte resuelto desaparece de la lista de abiertos", dd.querySelectorAll("tbody tr").length === antes - 1)
  // Limpieza no ve el tablero con nombres de huéspedes
  wl.location.hash = "#operaciones/estado"
  await hasta(() => dd.querySelectorAll(".hab").length === 50)
  informe("limpieza ve el estado de las habitaciones sin nombres de huéspedes", dd.querySelectorAll(".hab").length === 50 && ![...dd.querySelectorAll(".hab small")].some((s) => s.textContent.includes(",")) && dd.querySelectorAll(".calendario").length === 0)
  wl.close()

  // ---------- Seguridad en la interfaz ----------
  const di = await abrir("index.html", sesiones.recepcion)
  const wi = di.window
  await hasta(() => wi.document.querySelector("#nombreUsuario").textContent !== "")
  informe("una vista no permitida (administración) no se abre aunque se escriba en la dirección", (await (async () => {
    wi.location.hash = "#administracion/usuarios"
    await esperar(600)
    return wi.document.querySelector("#estadoModulo").textContent !== "Administración"
  })()))
  // Un texto con HTML no se interpreta como código
  const nombre = '<img src=x onerror="window.hackeado=1">'
  const r = await (await wi.fetch("api/crud.php?accion=guardar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entidad: "clientes", datos: { nombre, apellidos: "Prueba", dni_pasaporte: "ZZ7777777", pais: "España" } }) })).json()
  wi.location.hash = "#recepcion/clientes"
  await hasta(() => wi.document.querySelectorAll("tbody tr.fila").length > 100)
  await esperar(300)
  const aparece = wi.document.querySelector("#escenario").textContent.includes("<img src=x")
  informe("un nombre con etiquetas HTML se muestra como texto y no se ejecuta", r.ok && wi.hackeado === undefined && wi.document.querySelectorAll("#escenario img").length === 0 && aparece,
    "guardado=" + r.ok + (r.ok ? "" : " (" + r.error + ")") + ", ejecutado=" + (wi.hackeado !== undefined) + ", imágenes=" + wi.document.querySelectorAll("#escenario img").length + ", se ve como texto=" + aparece)
  wi.close()
}

async function principal() {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), "pms_ui_"))
  fs.cpSync(ORIGEN, carpeta, { recursive: true, filter: (f) => !f.endsWith("thistle.db") && !f.includes("exportaciones") })
  // El puerto tiene que estar libre: si no, hablaríamos con un servidor antiguo
  const ocupado = await fetch(BASE + "login.html").then(() => true).catch(() => false)
  if (ocupado) { console.error("El puerto " + PUERTO + " ya está en uso: cierra el servidor anterior"); process.exit(1) }
  const ext = process.env.SQLITE_EXT
  // "detached" crea un grupo de procesos propio: así se cierra también cada proceso hijo del servidor
  const servidor = spawn("php", [].concat(ext ? ["-d", "extension=" + ext] : [], ["-S", "127.0.0.1:" + PUERTO, "-t", carpeta]),
    { env: Object.assign({}, process.env, { PHP_CLI_SERVER_WORKERS: "8" }), stdio: "ignore", detached: true })
  await esperar(1500)
  try {
    await pruebas()
  } finally {
    try { process.kill(-servidor.pid) } catch (e) { servidor.kill() }
    fs.rmSync(carpeta, { recursive: true, force: true })
  }
  informe("ningún error de JavaScript en toda la sesión", errores.length === 0, errores.slice(0, 5).join(" | "))
  console.log("\nResumen: " + resultados.ok + " correctas, " + resultados.fallo + " con fallo")
  process.exit(resultados.fallo ? 1 : 0)
}

principal().catch((e) => { console.error("FALLO GENERAL", e); process.exit(1) })
