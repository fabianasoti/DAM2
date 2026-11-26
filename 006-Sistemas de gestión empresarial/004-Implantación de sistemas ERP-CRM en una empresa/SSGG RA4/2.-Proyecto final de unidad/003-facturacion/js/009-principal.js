// Esqueleto de la aplicación: comprueba la sesión, dibuja el menú según el rol y cambia de vista

let usuario = null    // quién ha iniciado sesión
let hoy = ""          // fecha de hoy según el servidor
let moduloActual = null
let vistaActual = null

const TODOS = ["admin", "recepcion", "mantenimiento", "limpieza"]
const RECEPCION = ["admin", "recepcion"]

// Módulos y vistas del menú. Cada vista dice qué rol puede verla y qué función la dibuja.
const MODULOS = [
  {
    id: "recepcion", texto: "Recepción", icono: "cama", roles: RECEPCION,
    vistas: [
      { id: "tablero", texto: "Tablero", icono: "cuadricula", dibujar: vistaTablero },
      { id: "reservas", texto: "Reservas", icono: "calendario", dibujar: vistaReservas },
      { id: "clientes", texto: "Clientes", icono: "usuarios", dibujar: function (c) { return vistaEntidad(c, "clientes") } },
      { id: "facturas", texto: "Facturas", icono: "libro", dibujar: vistaFacturas }
    ]
  },
  {
    id: "operaciones", texto: "Operaciones", icono: "llave", roles: TODOS,
    vistas: [
      { id: "estado", texto: "Estado de habitaciones", icono: "cuadricula", roles: ["mantenimiento", "limpieza"], dibujar: vistaTablero },
      { id: "averias", texto: "Averías", icono: "herramienta", roles: ["admin", "recepcion", "mantenimiento"], dibujar: function (c) { return vistaPartes(c, "averia") } },
      { id: "limpieza", texto: "Limpieza", icono: "escoba", roles: ["admin", "recepcion", "limpieza"], dibujar: function (c) { return vistaPartes(c, "limpieza") } }
    ]
  },
  {
    id: "informes", texto: "Informes", icono: "grafica", roles: RECEPCION,
    vistas: [
      { id: "dashboard", texto: "Dashboard", icono: "grafica", dibujar: vistaDashboard },
      { id: "consultas", texto: "Clientes y países", icono: "usuarios", dibujar: vistaConsultas },
      { id: "exportar", texto: "Exportar datos", icono: "descarga", dibujar: vistaExportar }
    ]
  },
  {
    id: "administracion", texto: "Administración", icono: "escudo", roles: ["admin"],
    vistas: [
      { id: "usuarios", texto: "Usuarios", icono: "usuarios", dibujar: function (c) { return vistaEntidad(c, "usuarios") } },
      { id: "habitaciones", texto: "Habitaciones", icono: "cama", dibujar: function (c) { return vistaEntidad(c, "habitaciones") } },
      { id: "temporadas", texto: "Temporadas", icono: "calendario", dibujar: function (c) { return vistaEntidad(c, "temporadas") } },
      { id: "auditoria", texto: "Auditoría", icono: "libro", dibujar: function (c) { return vistaEntidad(c, "auditoria") } }
    ]
  }
]

// Módulos y vistas que puede ver el rol del usuario
function modulosVisibles() {
  return MODULOS
    .filter(function (m) { return m.roles.includes(usuario.rol) })
    .map(function (m) {
      const vistas = m.vistas.filter(function (v) { return (v.roles || m.roles).includes(usuario.rol) })
      return Object.assign({}, m, { vistas: vistas })
    })
    .filter(function (m) { return m.vistas.length > 0 })
}

// ---------- Menú ----------
function pintarModulos() {
  const lista = document.querySelector("#listaModulos")
  vaciar(lista)
  modulosVisibles().forEach(function (modulo) {
    lista.append(h("a", {
      href: "#" + modulo.id + "/" + modulo.vistas[0].id,
      class: moduloActual && moduloActual.id === modulo.id ? "activo" : "",
      "data-modulo": modulo.id
    }, icono(modulo.icono), h("span", { class: "etiqueta" }, modulo.texto)))
  })
}

function pintarVistas() {
  const lista = document.querySelector("#listaVistas")
  vaciar(lista)
  const modulo = modulosVisibles().find(function (m) { return m.id === moduloActual.id })
  modulo.vistas.forEach(function (vista) {
    lista.append(h("a", {
      href: "#" + modulo.id + "/" + vista.id,
      class: vistaActual && vistaActual.id === vista.id ? "activo" : "",
      "data-vista": vista.id
    }, icono(vista.icono), h("span", { class: "etiqueta" }, vista.texto)))
  })
}

// ---------- Cambiar de vista ----------
// La dirección de la página (#modulo/vista) dice qué se está viendo, así se puede recargar sin perder el sitio
async function irA(idModulo, idVista) {
  const visibles = modulosVisibles()
  let modulo = visibles.find(function (m) { return m.id === idModulo }) || visibles[0]
  let vista = modulo.vistas.find(function (v) { return v.id === idVista }) || modulo.vistas[0]
  moduloActual = modulo
  vistaActual = vista

  pintarModulos()
  pintarVistas()
  document.querySelector("#estadoModulo").textContent = modulo.texto
  document.querySelector("#estadoVista").textContent = vista.texto
  document.querySelector("#estadoRegistros").textContent = ""
  document.querySelector("#buscador").value = ""
  document.querySelector("#buscador").oninput = null
  cerrarPanel()

  const escenario = document.querySelector("#escenario")
  vaciar(escenario)
  escenario.append(h("p", { class: "vacio" }, "Cargando…"))
  try {
    await vista.dibujar(escenario)
  } catch (error) {
    vaciar(escenario)
    escenario.append(h("p", { class: "vacio" }, "No se ha podido cargar esta vista: " + error.message))
  }
}

// Vuelve a dibujar la vista actual (por ejemplo, después de guardar algo)
function recargarVista() {
  if (moduloActual && vistaActual) { return irA(moduloActual.id, vistaActual.id) }
}

function leerDireccion() {
  const partes = location.hash.replace("#", "").split("/")
  return { modulo: partes[0], vista: partes[1] }
}

window.addEventListener("hashchange", function () {
  if (usuario === null) { return }    // todavía no se ha comprobado la sesión
  const d = leerDireccion()
  irA(d.modulo, d.vista)
})

// ---------- Buscador de la cabecera: filtra las filas de la tabla que se está viendo ----------
function activarBuscador(cuerpoTabla, textoVacio) {
  const buscador = document.querySelector("#buscador")
  buscador.oninput = function () {
    const texto = buscador.value.trim().toLowerCase()
    let visibles = 0
    for (const fila of cuerpoTabla.rows) {
      const coincide = texto === "" || fila.textContent.toLowerCase().includes(texto)
      fila.hidden = !coincide
      if (coincide) { visibles++ }
    }
    document.querySelector("#estadoRegistros").textContent = visibles + " registros"
  }
  buscador.oninput()
}

// ---------- Arranque ----------
async function iniciar() {
  try {
    const datos = await api("002-sesion.php?accion=yo")
    usuario = datos.usuario
    hoy = datos.hoy
    document.querySelector("#nombreHotel").textContent = datos.hotel
  } catch (error) {
    location.href = "001-login.html"
    return
  }
  document.querySelector("#nombreUsuario").textContent = usuario.nombre
  document.querySelector("#rolUsuario").textContent = usuario.rol
  document.title = "Thistle PMS · " + document.querySelector("#nombreHotel").textContent

  // Botones de la cabecera
  const botonNueva = document.querySelector("#botonNuevaReserva")
  if (RECEPCION.includes(usuario.rol)) {
    botonNueva.classList.remove("oculto")
    botonNueva.onclick = function () { abrirNuevaReserva({}) }
  }
  document.querySelector("#panelCerrar").append(icono("cerrar"))
  document.querySelector("#panelCerrar").onclick = cerrarPanel
  document.querySelector("#capaPanel").onclick = cerrarPanel
  document.querySelector("#cerrarSesion").onclick = async function () {
    try { await api("002-sesion.php?accion=logout", {}) } catch (error) { /* aunque falle, volvemos a la entrada */ }
    location.href = "001-login.html"
  }
  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") { cerrarPanel() }
  })

  // Estado de la conexión
  window.addEventListener("offline", function () {
    document.querySelector("#estadoConexion").textContent = "● Sin conexión"
    document.querySelector("#estadoConexion").classList.add("offline")
  })
  window.addEventListener("online", function () {
    document.querySelector("#estadoConexion").textContent = "● En línea"
    document.querySelector("#estadoConexion").classList.remove("offline")
  })

  const d = leerDireccion()
  irA(d.modulo, d.vista)
}

iniciar()
