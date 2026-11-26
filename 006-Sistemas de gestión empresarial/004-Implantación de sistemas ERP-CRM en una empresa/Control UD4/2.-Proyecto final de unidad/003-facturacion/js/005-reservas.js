// Reservas: lista con filtros, detalle con acciones (check-in, check-out, cancelar)
// y asistente para crear una reserva nueva (fechas -> habitaciones disponibles con precio -> cliente).

const ESTADOS_RESERVA = ["confirmada", "check-in", "check-out", "cancelada"]
const CANALES = ["directo", "web", "agencia", "telefono"]

// ---------- Lista de reservas ----------
async function vistaReservas(escenario) {
  vaciar(escenario)
  const f = { estado: "", canal: "", desde: "", hasta: "", q: "" }
  const cuerpo = h("tbody", {})
  const mensaje = h("p", { class: "ayuda" })

  const cargar = async function () {
    const parametros = Object.keys(f).filter(function (k) { return f[k] !== "" })
      .map(function (k) { return k + "=" + encodeURIComponent(f[k]) }).join("&")
    try {
      const datos = await api("005-reservas.php?accion=lista&" + parametros)
      vaciar(cuerpo)
      datos.reservas.forEach(function (r) {
        cuerpo.append(h("tr", { class: "fila", onclick: function () { abrirReserva(r.id) } },
          h("td", { class: "num" }, r.id), h("td", {}, r.cliente), h("td", {}, r.habitacion + " · " + r.tipo),
          h("td", {}, fechaCorta(r.fecha_entrada)), h("td", {}, fechaCorta(r.fecha_salida)),
          h("td", { class: "num" }, diasEntre(r.fecha_entrada, r.fecha_salida)),
          h("td", {}, etiquetaEstado(r.estado)), h("td", {}, r.canal), h("td", { class: "num" }, euros(r.importe_total))))
      })
      mensaje.textContent = datos.reservas.length === 300 ? "Se muestran las 300 más recientes. Usa los filtros para acotar." : ""
      document.querySelector("#estadoRegistros").textContent = datos.reservas.length + " reservas"
    } catch (error) { mostrarError(error) }
  }

  const campoFiltro = function (etiqueta, nombre, tipo, opciones) {
    const control = opciones
      ? h("select", { onchange: function (e) { f[nombre] = e.target.value; cargar() } },
        h("option", { value: "" }, "Todos"), opciones.map(function (o) { return h("option", { value: o }, o) }))
      : h("input", { type: tipo, placeholder: nombre === "q" ? "Cliente o habitación" : null,
        onchange: function (e) { f[nombre] = e.target.value.trim(); cargar() } })
    return h("label", {}, etiqueta, control)
  }

  escenario.append(
    h("div", { class: "cabecera-vista" },
      h("div", {}, h("h2", {}, "Reservas"), h("p", {}, "Pulsa una reserva para ver su detalle y cambiar su estado")),
      h("button", { class: "btn", type: "button", onclick: function () { abrirNuevaReserva({}) } }, "Nueva reserva")),
    h("div", { class: "filtros" },
      campoFiltro("Estado", "estado", null, ESTADOS_RESERVA), campoFiltro("Canal", "canal", null, CANALES),
      campoFiltro("Salida desde", "desde", "date"), campoFiltro("Entrada hasta", "hasta", "date"),
      campoFiltro("Buscar", "q", "search")),
    h("div", { class: "tabla-caja" }, h("table", {},
      h("thead", {}, h("tr", {}, ["#", "Cliente", "Habitación", "Entrada", "Salida", "Noches", "Estado", "Canal", "Importe"].map(function (t, i) {
        return h("th", { class: i === 0 || i === 5 || i === 8 ? "num" : "" }, t)
      }))), cuerpo)),
    mensaje)
  await cargar()
}

// ---------- Cambiar el estado de una reserva ----------
async function cambiarEstadoReserva(id, estado) {
  if (estado === "cancelada") {
    const seguro = await confirmar("Cancelar la reserva", "La reserva dejará de ocupar la habitación. Esta acción no se puede deshacer.", "Cancelar reserva", true)
    if (!seguro) { return }
  }
  try {
    const r = await api("005-reservas.php?accion=estado", { id: id, estado: estado })
    const textos = { "check-in": "Check-in hecho", "check-out": "Check-out hecho", "cancelada": "Reserva cancelada" }
    toast("exito", textos[estado], "La habitación queda " + r.estado_habitacion)
    cerrarPanel()
    recargarVista()
  } catch (error) {
    mostrarError(error)
  }
}

// ---------- Detalle de una reserva ----------
async function abrirReserva(id) {
  try {
    const datos = await api("005-reservas.php?accion=ver&id=" + id)
    const r = datos.reserva
    const detalles = [
      ["Estado", etiquetaEstado(r.estado)], ["Cliente", r.cliente], ["Contacto", [r.telefono, r.email].filter(Boolean).join(" · ") || "—"],
      ["Habitación", r.habitacion + " · " + r.tipo + " · planta " + r.planta], ["Entrada", fechaCorta(r.fecha_entrada)],
      ["Salida", fechaCorta(r.fecha_salida)], ["Noches", r.noches], ["Huéspedes", r.num_huespedes], ["Canal", r.canal],
      ["Importe", euros(r.importe_total)], ["Creada", fechaCorta(r.fecha_creacion)]
    ]
    const botones = []
    const nombres = { "check-in": "Hacer check-in", "check-out": "Hacer check-out", "cancelada": "Cancelar reserva" }
    datos.permitidas.forEach(function (estado) {
      botones.push(h("button", {
        class: estado === "cancelada" ? "btn secundario" : "btn", type: "button",
        onclick: function () { cambiarEstadoReserva(r.id, estado) }
      }, nombres[estado]))
    })
    if (r.estado === "confirmada" && r.estado_habitacion !== "disponible") {
      botones.push(h("p", { class: "ayuda" }, "La habitación está " + r.estado_habitacion + ": el check-in no será posible hasta que esté disponible."))
    }
    abrirPanel({
      etiqueta: "RESERVA #" + r.id, titulo: r.cliente,
      cuerpo: [h("dl", { class: "detalle" }, detalles.map(function (d) { return [h("dt", {}, d[0]), h("dd", {}, d[1])] }))],
      pie: botones
    })
  } catch (error) { mostrarError(error) }
}

// ---------- Nueva reserva ----------
// opciones (todas opcionales): habitacion_id y fecha_entrada, para empezar con esos datos ya puestos
async function abrirNuevaReserva(opciones) {
  let habitacionElegida = opciones.habitacion_id || null
  let clienteElegido = null
  let clientes = []
  let clienteNuevo = false

  const entrada = h("input", { type: "date", min: hoy, value: opciones.fecha_entrada || hoy })
  const salida = h("input", { type: "date", min: hoy, value: sumarDias(opciones.fecha_entrada || hoy, 1) })
  const huespedes = h("select", {}, [1, 2, 3, 4, 5, 6].map(function (n) { return h("option", { value: n }, n) }))
  const canal = h("select", {}, CANALES.map(function (c) { return h("option", { value: c }, c) }))
  const error = h("p", { class: "error-form", role: "alert" })
  const listaHabitaciones = h("div", { class: "opciones" })
  const filtroCliente = h("input", { type: "search", placeholder: "Buscar cliente por nombre o documento" })
  const listaClientes = h("div", { class: "opciones" })
  const campoNuevo = h("div", { class: "form oculto" },
    h("label", {}, h("span", {}, "Nombre"), h("input", { id: "nuevoNombre", maxlength: 60 })),
    h("label", {}, h("span", {}, "Apellidos"), h("input", { id: "nuevoApellidos", maxlength: 80 })),
    h("label", {}, h("span", {}, "Documento (DNI o pasaporte)"), h("input", { id: "nuevoDocumento", maxlength: 30 })))
  const botonConfirmar = h("button", { class: "btn", type: "button", disabled: true }, "Confirmar reserva")
  const botonCliente = h("button", { class: "btn secundario pequeno", type: "button" }, "Cliente nuevo")

  const actualizarBoton = function () {
    botonConfirmar.disabled = !(habitacionElegida && (clienteElegido || clienteNuevo))
  }

  // 1. Buscar habitaciones libres para esas fechas
  const buscar = async function () {
    error.textContent = ""
    vaciar(listaHabitaciones)
    try {
      const d = await api("005-reservas.php?accion=disponibles&entrada=" + entrada.value + "&salida=" + salida.value + "&huespedes=" + huespedes.value)
      if (d.habitaciones.length === 0) {
        listaHabitaciones.append(h("p", { class: "ayuda" }, "No hay habitaciones disponibles para esas fechas y ese número de huéspedes."))
        habitacionElegida = null
      }
      d.habitaciones.forEach(function (hab) {
        const opcion = h("div", { class: "opcion" + (hab.id === habitacionElegida ? " elegida" : ""), tabindex: 0, role: "button",
          onclick: function () {
            habitacionElegida = hab.id
            listaHabitaciones.querySelectorAll(".opcion").forEach(function (o) { o.classList.remove("elegida") })
            opcion.classList.add("elegida")
            actualizarBoton()
          } },
          h("span", {}, h("strong", {}, "Hab. " + hab.numero + " · " + hab.tipo),
            h("small", {}, "Planta " + hab.planta + " · hasta " + hab.capacidad + " personas · " + euros(hab.importe / d.noches) + " por noche de media")),
          h("strong", { class: "precio" }, euros(hab.importe)))
        listaHabitaciones.append(opcion)
      })
      if (!d.habitaciones.some(function (hab) { return hab.id === habitacionElegida })) { habitacionElegida = null }
      actualizarBoton()
    } catch (e) { error.textContent = e.message }
  }

  // 2. Buscar cliente
  const pintarClientes = function () {
    vaciar(listaClientes)
    const texto = filtroCliente.value.trim().toLowerCase()
    clientes.filter(function (c) { return texto === "" || (c.nombre + " " + c.apellidos + " " + c.dni_pasaporte).toLowerCase().includes(texto) })
      .slice(0, 6).forEach(function (c) {
        const opcion = h("div", { class: "opcion" + (c.id === clienteElegido ? " elegida" : ""), tabindex: 0, role: "button",
          onclick: function () {
            clienteElegido = c.id
            listaClientes.querySelectorAll(".opcion").forEach(function (o) { o.classList.remove("elegida") })
            opcion.classList.add("elegida")
            actualizarBoton()
          } }, h("span", {}, h("strong", {}, c.apellidos + ", " + c.nombre), h("small", {}, c.dni_pasaporte + " · " + c.pais)))
        listaClientes.append(opcion)
      })
  }
  filtroCliente.oninput = pintarClientes
  botonCliente.onclick = function () {
    clienteNuevo = !clienteNuevo
    campoNuevo.classList.toggle("oculto", !clienteNuevo)
    listaClientes.classList.toggle("oculto", clienteNuevo)
    filtroCliente.classList.toggle("oculto", clienteNuevo)
    botonCliente.textContent = clienteNuevo ? "Elegir cliente existente" : "Cliente nuevo"
    actualizarBoton()
  }

  // 3. Confirmar
  botonConfirmar.onclick = async function () {
    error.textContent = ""
    botonConfirmar.disabled = true
    try {
      let idCliente = clienteElegido
      if (clienteNuevo) {
        const nuevo = await api("004-crud.php?accion=guardar", { entidad: "clientes", datos: {
          nombre: document.querySelector("#nuevoNombre").value, apellidos: document.querySelector("#nuevoApellidos").value,
          dni_pasaporte: document.querySelector("#nuevoDocumento").value, pais: "España" } })
        idCliente = nuevo.id
      }
      const r = await api("005-reservas.php?accion=crear", {
        habitacion_id: habitacionElegida, cliente_id: idCliente, fecha_entrada: entrada.value, fecha_salida: salida.value,
        num_huespedes: parseInt(huespedes.value), canal: canal.value })
      toast("exito", "Reserva creada", r.noches + (r.noches === 1 ? " noche" : " noches") + " · " + euros(r.importe))
      cerrarPanel()
      recargarVista()
    } catch (e) {
      error.textContent = e.message
      actualizarBoton()
    }
  }

  const buscador = h("button", { class: "btn secundario", type: "button", onclick: buscar }, "Buscar habitaciones disponibles")
  entrada.onchange = function () {
    if (salida.value <= entrada.value) { salida.value = sumarDias(entrada.value, 1) }
    salida.min = sumarDias(entrada.value, 1)
  }

  abrirPanel({
    etiqueta: "NUEVA RESERVA", titulo: "Reservar una habitación",
    cuerpo: h("div", { class: "form" },
      h("div", { class: "doble" }, h("label", {}, h("span", {}, "Entrada"), entrada), h("label", {}, h("span", {}, "Salida"), salida)),
      h("div", { class: "doble" }, h("label", {}, h("span", {}, "Huéspedes"), huespedes), h("label", {}, h("span", {}, "Canal"), canal)),
      buscador, listaHabitaciones,
      h("h3", {}, "Cliente"), filtroCliente, listaClientes, campoNuevo, botonCliente, error),
    pie: [h("button", { class: "btn secundario", type: "button", onclick: cerrarPanel }, "Cancelar"), botonConfirmar]
  })

  // La lista de clientes se pide una vez al abrir el panel
  try {
    const d = await api("004-crud.php?entidad=clientes")
    clientes = d.registros
    pintarClientes()
  } catch (e) { error.textContent = e.message }
  if (opciones.habitacion_id || opciones.fecha_entrada) { buscar() }
}
