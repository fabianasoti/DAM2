// Pantalla de facturas: lista por mes con sus totales

let mesFacturas = ""      // mes que se está viendo (AAAA-MM)

async function vistaFacturas(escenario) {
  if (mesFacturas === "") { mesFacturas = hoy.slice(0, 7) }
  const datos = await api("010-facturas.php?accion=lista&mes=" + mesFacturas)
  vaciar(escenario)

  const selector = h("input", { type: "month", value: mesFacturas, "aria-label": "Mes", onchange: function (e) {
    if (e.target.value) { mesFacturas = e.target.value; recargarVista() }
  } })
  const t = datos.totales

  escenario.append(h("div", { class: "cabecera-vista" },
    h("div", {}, h("h2", {}, "Facturas"),
      h("p", {}, t.facturas + " facturas · base " + euros(t.base) + " · IVA " + euros(t.iva) + " · total " + euros(t.total))),
    selector))

  if (datos.facturas.length === 0) {
    escenario.append(h("p", { class: "vacio" }, "No hay facturas en este mes"))
    return
  }

  escenario.append(h("div", { class: "tabla-caja" }, h("table", {},
    h("thead", {}, h("tr", {}, ["Número", "Fecha", "Cliente", "Habitación"].map(function (x) { return h("th", {}, x) }),
      ["Base", "IVA", "Total"].map(function (x) { return h("th", { class: "num" }, x) }), h("th", {}, "Pago"))),
    h("tbody", {}, datos.facturas.map(function (f) {
      return h("tr", { class: "fila", onclick: function () { abrirFactura(f.id) } },
        h("td", {}, f.numero), h("td", {}, fechaCorta(f.fecha)), h("td", {}, f.cliente), h("td", {}, f.habitacion),
        h("td", { class: "num" }, euros(f.base)), h("td", { class: "num" }, euros(f.iva)), h("td", { class: "num" }, euros(f.total)),
        h("td", {}, f.forma_pago))
    })))))

  document.querySelector("#estadoRegistros").textContent = datos.facturas.length + " facturas"
}

// Detalle de una factura en el panel lateral
async function abrirFactura(id) {
  try {
    const datos = await api("010-facturas.php?accion=ver&id=" + id)
    const f = datos.factura
    const filas = [
      ["Cliente", f.cliente], ["Documento", f.dni_pasaporte], ["Habitación", f.habitacion + " · " + f.tipo],
      ["Estancia", fechaCorta(f.fecha_entrada) + " a " + fechaCorta(f.fecha_salida) + " (" + f.noches + " noches)"],
      ["Base", euros(f.base)], ["IVA " + f.iva_porcentaje + " %", euros(f.iva)], ["Total", euros(f.total)], ["Forma de pago", f.forma_pago]
    ]
    abrirPanel({
      etiqueta: "Factura", titulo: f.numero,
      cuerpo: h("dl", { class: "detalle" }, filas.map(function (d) { return [h("dt", {}, d[0]), h("dd", {}, d[1])] })),
      pie: h("button", { class: "btn", type: "button", onclick: function () { imprimirFactura(f.id) } }, "Imprimir factura")
    })
  } catch (error) {
    mostrarError(error)
  }
}
