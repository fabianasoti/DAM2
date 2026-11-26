// Núcleo de la interfaz: crear elementos, llamar a la API y componentes comunes
// (avisos, panel lateral y ventana de confirmación)

// ---------- Crear elementos HTML ----------
// h("div", { class: "caja", onclick: funcion }, "texto", otroElemento)
// El texto se añade siempre como texto (nunca como HTML), así no se puede inyectar código
function h(etiqueta, propiedades, ...hijos) {
  const nodo = document.createElement(etiqueta)
  let valor = null
  for (const clave in (propiedades || {})) {
    const dato = propiedades[clave]
    if (dato === null || dato === undefined || dato === false) { continue }
    if (clave === "class") { nodo.className = dato }
    else if (clave === "value") { valor = dato }                  // se pone al final, después de las opciones
    else if (clave.startsWith("on")) { nodo[clave] = dato }       // onclick, oninput, onchange...
    else { nodo.setAttribute(clave, dato === true ? "" : dato) }
  }
  anadirHijos(nodo, hijos)
  if (valor !== null) { nodo.value = valor }
  return nodo
}

function anadirHijos(nodo, hijos) {
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) { continue }
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)))
  }
}

function vaciar(nodo) {
  while (nodo.firstChild) { nodo.removeChild(nodo.firstChild) }
}

// ---------- Llamadas a la API ----------
// api("005-reservas.php?accion=lista")            -> GET
// api("005-reservas.php?accion=crear", {...})     -> POST con JSON
// Si la sesión ha caducado (401), vuelve a la pantalla de entrada
async function api(ruta, datos) {
  const url = ruta.startsWith("servicios/") ? ruta : "api/" + ruta
  const opciones = datos === undefined ? {} : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  }
  let respuesta
  try {
    respuesta = await fetch(url, opciones)
  } catch (error) {
    throw new Error("No se puede conectar con el servidor")
  }
  if (respuesta.status === 401 && !ruta.startsWith("002-sesion.php")) {
    location.href = "001-login.html"
    throw new Error("La sesión ha caducado")
  }
  let json
  try {
    json = await respuesta.json()
  } catch (error) {
    throw new Error("El servidor ha devuelto una respuesta no válida")
  }
  if (!json.ok) { throw new Error(json.error || "Error desconocido") }
  return json
}

// ---------- Formatos ----------
function euros(numero) {
  return Number(numero || 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

function fechaCorta(iso) {
  if (!iso) { return "" }
  const partes = iso.slice(0, 10).split("-")
  return partes[2] + "/" + partes[1] + "/" + partes[0]
}

// ---------- Avisos (toasts) ----------
function toast(tipo, titulo, texto) {
  const aviso = h("article", { class: "toast " + tipo, role: "status" },
    h("p", { class: "t-titulo" }, titulo),
    texto ? h("p", { class: "t-texto" }, texto) : null)
  document.querySelector("#toasts").append(aviso)
  document.querySelector("#estadoEvento").textContent = titulo + (texto ? ": " + texto : "")
  setTimeout(function () { aviso.remove() }, tipo === "error" ? 7000 : 4000)
}

function mostrarError(error) {
  toast("error", "No se ha podido completar", error.message)
}

// ---------- Panel lateral ----------
// abrirPanel({ etiqueta, titulo, cuerpo, pie }) y cerrarPanel()
function abrirPanel(opciones) {
  document.querySelector("#panelEtiqueta").textContent = opciones.etiqueta || ""
  document.querySelector("#panelTitulo").textContent = opciones.titulo || ""
  const cuerpo = document.querySelector("#panelCuerpo")
  const pie = document.querySelector("#panelPie")
  vaciar(cuerpo)
  vaciar(pie)
  anadirHijos(cuerpo, [opciones.cuerpo])
  anadirHijos(pie, [opciones.pie])
  document.querySelector("#panel").classList.add("abierto")
  document.querySelector("#panel").setAttribute("aria-hidden", "false")
  document.querySelector("#capaPanel").classList.add("abierta")
}

function cerrarPanel() {
  document.querySelector("#panel").classList.remove("abierto")
  document.querySelector("#panel").setAttribute("aria-hidden", "true")
  document.querySelector("#capaPanel").classList.remove("abierta")
}

// ---------- Ventana de confirmación ----------
// Devuelve una promesa: true si se acepta, false si se cancela
function confirmar(titulo, texto, textoBoton, peligro) {
  return new Promise(function (resolver) {
    document.querySelector("#modalTitulo").textContent = titulo
    document.querySelector("#modalTexto").textContent = texto
    const botones = document.querySelector("#modalBotones")
    vaciar(botones)
    const cerrar = function (respuesta) {
      document.querySelector("#modal").classList.remove("abierto")
      resolver(respuesta)
    }
    botones.append(
      h("button", { class: "btn secundario", type: "button", onclick: function () { cerrar(false) } }, "Cancelar"),
      h("button", { class: "btn" + (peligro ? " peligro" : ""), type: "button", onclick: function () { cerrar(true) } }, textoBoton || "Aceptar")
    )
    document.querySelector("#modal").classList.add("abierto")
  })
}

// ---------- Pequeñas ayudas para etiquetas ----------
function etiquetaEstado(estado) {
  const nombres = { "en_proceso": "en proceso" }
  return h("span", { class: "badge b-" + estado }, nombres[estado] || estado)
}

// ---------- Fechas (texto AAAA-MM-DD) ----------
// Se calculan en UTC para que el cambio de hora no afecte a los días
function sumarDias(iso, dias) {
  const fecha = new Date(iso + "T00:00:00Z")
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

function diasEntre(desde, hasta) {
  return Math.round((new Date(hasta + "T00:00:00Z") - new Date(desde + "T00:00:00Z")) / 86400000)
}

// 0 = domingo ... 6 = sábado
function diaSemana(iso) {
  return new Date(iso + "T00:00:00Z").getUTCDay()
}
