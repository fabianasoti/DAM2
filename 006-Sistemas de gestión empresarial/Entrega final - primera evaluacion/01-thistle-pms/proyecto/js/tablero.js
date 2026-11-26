// Tablero de recepción: plano de habitaciones por color de estado, llegadas y salidas de hoy,
// y calendario de ocupación de los próximos días.

const ESTADOS_HABITACION = [
  { id: "disponible", texto: "Disponibles" },
  { id: "ocupada", texto: "Ocupadas" },
  { id: "sucia", texto: "Sucias" },
  { id: "mantenimiento", texto: "En mantenimiento" }
]

async function vistaTablero(escenario) {
  const datos = await api("tablero.php?dias=14")
  vaciar(escenario)
  const veReservas = RECEPCION.includes(usuario.rol)
  let estadoDestacado = null    // si se pulsa una etiqueta, solo se destacan esas habitaciones
  const losHabitaciones = []

  // Cabecera y etiquetas con el recuento de cada estado
  const leyenda = h("div", { class: "leyenda" })
  const pintarLeyenda = function () {
    vaciar(leyenda)
    ESTADOS_HABITACION.forEach(function (e) {
      leyenda.append(h("button", {
        class: "chip" + (estadoDestacado && estadoDestacado !== e.id ? " apagado" : ""), type: "button",
        title: "Pulsa para destacar estas habitaciones",
        onclick: function () { estadoDestacado = estadoDestacado === e.id ? null : e.id; pintarLeyenda(); destacar() }
      }, h("span", { class: "punto " + e.id }), h("strong", {}, datos.resumen[e.id]), e.texto))
    })
  }
  const destacar = function () {
    losHabitaciones.forEach(function (b) { b.nodo.classList.toggle("apagada", estadoDestacado !== null && b.estado !== estadoDestacado) })
  }

  escenario.append(h("div", { class: "cabecera-vista" },
    h("div", {}, h("h2", {}, "Tablero"), h("p", {}, fechaCorta(datos.hoy) + " · " + datos.habitaciones.length + " habitaciones"))))
  pintarLeyenda()
  escenario.append(leyenda)

  // Plano: una fila por planta
  const plano = h("div", {})
  const plantas = {}
  datos.habitaciones.forEach(function (hab) {
    if (!plantas[hab.planta]) { plantas[hab.planta] = [] }
    plantas[hab.planta].push(hab)
  })
  Object.keys(plantas).sort().forEach(function (planta) {
    const fila = h("div", { class: "habitaciones" })
    plantas[planta].forEach(function (hab) {
      const detalle = hab.huesped ? hab.huesped.split(",")[0] : hab.tipo
      const casilla = h("button", {
        type: "button", class: "hab " + hab.estado,
        title: "Habitación " + hab.numero + " · " + hab.tipo + " · " + hab.estado,
        onclick: function () { abrirHabitacion(hab, datos) }
      }, h("strong", {}, hab.numero), h("small", {}, detalle),
        (hab.averias > 0 || hab.limpiezas > 0) ? h("span", { class: "aviso", title: "Tiene partes de trabajo abiertos" }) : null)
      losHabitaciones.push({ nodo: casilla, estado: hab.estado })
      fila.append(casilla)
    })
    plano.append(h("div", { class: "planta" }, h("span", {}, "Planta " + planta), fila))
  })

  // Columna lateral: llegadas y salidas de hoy (solo recepción)
  const lateral = h("div", { class: "lateral" })
  if (veReservas) {
    lateral.append(h("div", { class: "tarjeta" }, h("h3", {}, "Llegadas de hoy (" + datos.llegadas.length + ")"),
      datos.llegadas.length === 0 ? h("p", { class: "ayuda" }, "No hay llegadas pendientes.") :
        h("ul", { class: "lista-hoy" }, datos.llegadas.map(function (l) {
          const listo = l.estado_habitacion === "disponible"
          return h("li", {},
            h("span", {}, l.cliente, h("small", {}, "Hab. " + l.habitacion + " · " + l.num_huespedes + (l.num_huespedes === 1 ? " huésped" : " huéspedes"))),
            h("span", {}, listo ? null : etiquetaEstado(l.estado_habitacion), " ",
              h("button", {
                class: "btn pequeno", type: "button", disabled: !listo,
                title: listo ? "Hacer el check-in" : "La habitación no está lista (" + l.estado_habitacion + ")",
                onclick: function () { cambiarEstadoReserva(l.id, "check-in") }
              }, "Check-in")))
        }))))
    lateral.append(h("div", { class: "tarjeta" }, h("h3", {}, "Salidas de hoy (" + datos.salidas.length + ")"),
      datos.salidas.length === 0 ? h("p", { class: "ayuda" }, "No hay salidas pendientes.") :
        h("ul", { class: "lista-hoy" }, datos.salidas.map(function (s) {
          return h("li", {},
            h("span", {}, s.cliente, h("small", {}, "Hab. " + s.habitacion + " · " + euros(s.importe_total))),
            h("button", { class: "btn pequeno secundario", type: "button", onclick: function () { cambiarEstadoReserva(s.id, "check-out") } }, "Check-out"))
        }))))
  } else {
    lateral.append(h("div", { class: "tarjeta" }, h("h3", {}, "Tus partes de trabajo"),
      h("p", { class: "ayuda" }, "Los puntos rosas del plano marcan habitaciones con partes abiertos. Pulsa una habitación para ver los detalles.")))
  }
  escenario.append(h("div", { class: "tablero" }, plano, lateral))

  // Calendario de los próximos días
  if (veReservas && datos.calendario) {
    escenario.append(h("div", { class: "cabecera-vista", style: "margin-top: 24px" },
      h("div", {}, h("h2", {}, "Calendario"), h("p", {}, "Próximos " + datos.calendario.dias + " días. Pulsa una celda vacía para reservar o una reserva para verla."))))
    escenario.append(pintarCalendario(datos.calendario, datos.habitaciones))
  }
  document.querySelector("#estadoRegistros").textContent = datos.habitaciones.length + " habitaciones"
}

function pintarCalendario(calendario, habitaciones) {
  const dias = []
  for (let i = 0; i < calendario.dias; i++) { dias.push(sumarDias(calendario.desde, i)) }
  const letras = ["D", "L", "M", "X", "J", "V", "S"]

  const cabecera = h("tr", {}, h("th", { class: "cab-hab" }, "Hab."), dias.map(function (d) {
    const finde = diaSemana(d) === 0 || diaSemana(d) === 6
    return h("th", { class: (d === calendario.desde ? "hoy " : "") + (finde ? "finde" : ""), title: fechaCorta(d) },
      letras[diaSemana(d)], h("br"), d.slice(8, 10))
  }))

  // Reservas agrupadas por habitación
  const porHabitacion = {}
  calendario.reservas.forEach(function (r) {
    if (!porHabitacion[r.habitacion_id]) { porHabitacion[r.habitacion_id] = [] }
    porHabitacion[r.habitacion_id].push(r)
  })

  const filas = habitaciones.map(function (hab) {
    const celdas = []
    const reservas = porHabitacion[hab.id] || []
    let i = 0
    while (i < dias.length) {
      const dia = dias[i]
      const reserva = reservas.find(function (r) { return r.fecha_entrada <= dia && dia < r.fecha_salida })
      if (reserva) {
        // La reserva ocupa tantas celdas como noches le quedan dentro del calendario
        const noches = Math.min(dias.length - i, diasEntre(dia, reserva.fecha_salida))
        celdas.push(h("td", {
          class: "reserva r-" + reserva.estado, colspan: noches,
          title: reserva.cliente + " · " + fechaCorta(reserva.fecha_entrada) + " a " + fechaCorta(reserva.fecha_salida) + " · " + reserva.estado,
          onclick: function () { abrirReserva(reserva.id) }
        }, reserva.cliente))
        i += noches
      } else {
        const finde = diaSemana(dia) === 0 || diaSemana(dia) === 6
        celdas.push(h("td", {
          class: "vacia" + (finde ? " finde" : ""), title: "Reservar la " + hab.numero + " desde el " + fechaCorta(dia),
          onclick: function () { abrirNuevaReserva({ habitacion_id: hab.id, fecha_entrada: dia }) }
        }))
        i++
      }
    }
    return h("tr", {}, h("th", { class: "cab-hab", title: hab.tipo }, hab.numero), celdas)
  })

  return h("div", { class: "calendario" }, h("table", {}, h("thead", {}, cabecera), h("tbody", {}, filas)))
}

// Panel con los datos de una habitación y lo que se puede hacer desde ahí
function abrirHabitacion(hab, datos) {
  const veReservas = RECEPCION.includes(usuario.rol)
  const detalles = [["Planta", hab.planta], ["Tipo", hab.tipo], ["Capacidad", hab.capacidad + " personas"]]
  if (hab.huesped) { detalles.push(["Huésped", hab.huesped], ["Salida", fechaCorta(hab.salida)]) }
  detalles.push(["Averías abiertas", hab.averias], ["Limpiezas pendientes", hab.limpiezas])

  const pie = []
  if (veReservas && hab.reserva_id) {
    pie.push(h("button", { class: "btn secundario", type: "button", onclick: function () { abrirReserva(hab.reserva_id) } }, "Ver reserva"))
  }
  if (veReservas) {
    pie.push(h("button", { class: "btn secundario", type: "button", onclick: function () { abrirNuevaReserva({ habitacion_id: hab.id }) } }, "Nueva reserva"))
  }
  pie.push(h("button", { class: "btn", type: "button", onclick: function () { abrirNuevaAveria(hab.id) } }, "Avisar de avería"))

  abrirPanel({
    etiqueta: "HABITACIÓN", titulo: hab.numero,
    cuerpo: [h("p", {}, etiquetaEstado(hab.estado)),
      h("dl", { class: "detalle" }, detalles.map(function (d) { return [h("dt", {}, d[0]), h("dd", {}, d[1])] }))],
    pie: pie
  })
}
