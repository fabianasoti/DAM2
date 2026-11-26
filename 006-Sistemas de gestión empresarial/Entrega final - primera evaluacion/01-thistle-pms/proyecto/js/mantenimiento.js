// Partes de mantenimiento (averías) y de limpieza

const PRIORIDADES = ["baja", "media", "alta", "urgente"]

async function vistaPartes(escenario, tipo) {
  vaciar(escenario)
  let estado = "abiertos"
  const titulo = tipo === "averia" ? "Averías" : "Limpieza"
  const cuerpo = h("tbody", {})
  const pestanas = h("div", { class: "fila-botones", style: "margin-bottom: 12px" })

  const cargar = async function () {
    const d = await api("mantenimiento.php?tipo=" + tipo + "&estado=" + estado)
    vaciar(cuerpo)
    d.partes.forEach(function (p) {
      const acciones = []
      if (d.puede_trabajar && p.estado === "pendiente") {
        acciones.push(h("button", { class: "btn pequeno secundario", type: "button", onclick: function () { trabajarParte("asignar", p.id) } }, "Asignarme"))
      }
      if (d.puede_trabajar && p.estado !== "resuelto") {
        acciones.push(" ", h("button", { class: "btn pequeno", type: "button", onclick: function () { trabajarParte("resolver", p.id) } }, "Resolver"))
      }
      cuerpo.append(h("tr", {},
        h("td", {}, h("strong", {}, p.habitacion)), h("td", {}, p.descripcion),
        h("td", {}, h("span", { class: "badge b-" + p.prioridad }, p.prioridad)), h("td", {}, etiquetaEstado(p.estado)),
        h("td", {}, p.asignado || "—"), h("td", {}, fechaCorta(p.fecha_creacion)), h("td", {}, acciones)))
    })
    if (d.partes.length === 0) {
      cuerpo.append(h("tr", {}, h("td", { colspan: 7, class: "vacio" }, estado === "abiertos" ? "No hay partes abiertos." : "Todavía no hay partes resueltos.")))
    }
    document.querySelector("#estadoRegistros").textContent = d.partes.length + " partes"
    activarBuscador(cuerpo)
  }

  const pintarPestanas = function () {
    vaciar(pestanas)
    ;[["abiertos", "Abiertos"], ["resuelto", "Resueltos"]].forEach(function (p) {
      pestanas.append(h("button", {
        class: "btn pequeno" + (estado === p[0] ? "" : " secundario"), type: "button",
        onclick: function () { estado = p[0]; pintarPestanas(); cargar().catch(mostrarError) }
      }, p[1]))
    })
  }

  escenario.append(
    h("div", { class: "cabecera-vista" },
      h("div", {}, h("h2", {}, titulo), h("p", {}, tipo === "averia" ? "Las averías altas y urgentes bloquean la habitación hasta que se resuelven" : "Cada check-out genera un parte de limpieza; al resolverlo, la habitación queda disponible")),
      tipo === "averia" ? h("button", { class: "btn", type: "button", onclick: function () { abrirNuevaAveria(null) } }, "Avisar de una avería") : null),
    pestanas,
    h("div", { class: "tabla-caja" }, h("table", {},
      h("thead", {}, h("tr", {}, ["Habitación", "Descripción", "Prioridad", "Estado", "Asignado a", "Creado", ""].map(function (t) { return h("th", {}, t) }))), cuerpo)))
  pintarPestanas()
  await cargar()
}

// Asignarse un parte o resolverlo
async function trabajarParte(accion, id) {
  try {
    const r = await api("mantenimiento.php?accion=" + accion, { id: id })
    toast("exito", accion === "asignar" ? "Parte asignado" : "Parte resuelto", "La habitación queda " + r.estado_habitacion)
    recargarVista()
  } catch (error) { mostrarError(error) }
}

// Formulario para avisar de una avería (lo puede hacer cualquier empleado)
async function abrirNuevaAveria(habitacionId) {
  const tablero = await api("tablero.php?dias=7").catch(function () { return { habitaciones: [] } })
  const habitacion = h("select", { value: habitacionId || "" },
    h("option", { value: "" }, "Elige una habitación"),
    tablero.habitaciones.map(function (hab) { return h("option", { value: hab.id }, hab.numero + " · " + hab.tipo) }))
  const descripcion = h("textarea", { rows: 3, maxlength: 200, placeholder: "Qué ocurre" })
  const prioridad = h("select", { value: "media" }, PRIORIDADES.map(function (p) { return h("option", { value: p }, p) }))
  const error = h("p", { class: "error-form", role: "alert" })
  const guardar = h("button", { class: "btn", type: "button" }, "Registrar avería")

  guardar.onclick = async function () {
    error.textContent = ""
    guardar.disabled = true
    try {
      const r = await api("mantenimiento.php?accion=crear", {
        habitacion_id: parseInt(habitacion.value) || 0, descripcion: descripcion.value, prioridad: prioridad.value })
      toast("exito", "Avería registrada", r.estado_habitacion === "mantenimiento" ? "La habitación queda bloqueada" : "La habitación sigue " + r.estado_habitacion)
      cerrarPanel()
      recargarVista()
    } catch (e) {
      error.textContent = e.message
      guardar.disabled = false
    }
  }

  abrirPanel({
    etiqueta: "AVERÍA", titulo: "Avisar de una avería",
    cuerpo: h("div", { class: "form" },
      h("label", {}, h("span", {}, "Habitación"), habitacion),
      h("label", {}, h("span", {}, "Descripción"), descripcion),
      h("label", {}, h("span", {}, "Prioridad"), prioridad),
      h("p", { class: "ayuda" }, "Las prioridades alta y urgente bloquean la habitación para nuevas reservas."), error),
    pie: [h("button", { class: "btn secundario", type: "button", onclick: cerrarPanel }, "Cancelar"), guardar]
  })
}
