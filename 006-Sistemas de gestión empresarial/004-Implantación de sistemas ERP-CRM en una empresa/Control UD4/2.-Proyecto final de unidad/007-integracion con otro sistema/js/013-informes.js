// Informes para imprimir (o guardar como PDF desde el diálogo de impresión)

let tipoInforme = "parte"     // "parte", "mensual" o "factura"
let facturaInforme = 0        // factura que se quiere imprimir
let fechaInforme = ""
let mesInforme = ""

// Desde la pantalla de facturas: abre esa factura lista para imprimir
function imprimirFactura(id) {
  tipoInforme = "factura"
  facturaInforme = id
  cerrarPanel()
  location.hash = "#informes/imprimir"
}

function cabeceraHoja(datos, titulo) {
  return h("div", { class: "hoja-cabecera" },
    h("div", {}, h("strong", {}, datos.hotel), h("p", {}, datos.emisor.razon_social),
      h("p", {}, "NIF " + datos.emisor.nif), h("p", {}, datos.emisor.direccion)),
    h("h2", {}, titulo))
}

// Parte diario: llegadas, salidas y huéspedes alojados
function hojaParte(datos) {
  const columnas = [
    ["Habitación", function (f) { return f.habitacion }],
    ["Cliente", function (f) { return f.cliente }],
    ["Huéspedes", function (f) { return f.num_huespedes }, true],
    ["Entrada", function (f) { return fechaCorta(f.fecha_entrada) }],
    ["Salida", function (f) { return fechaCorta(f.fecha_salida) }],
    ["Estado", function (f) { return f.estado }]
  ]
  const hoja = [cabeceraHoja(datos, "Parte de recepción · " + fechaCorta(datos.fecha))]
  const bloques = [["Llegadas", datos.llegadas], ["Salidas", datos.salidas], ["Alojados esa noche", datos.alojados]]
  bloques.forEach(function (b) {
    hoja.push(h("h3", {}, b[0] + " (" + b[1].length + ")"))
    hoja.push(b[1].length > 0 ? tablaSimple(columnas, b[1]) : h("p", {}, "Ninguna"))
  })
  return hoja
}

// Resumen de facturación de un mes
function hojaMensual(datos) {
  const importes = [
    ["Facturas", function (f) { return f.facturas }, true],
    ["Base", function (f) { return euros(f.base) }, true],
    ["IVA", function (f) { return euros(f.iva) }, true],
    ["Total", function (f) { return euros(f.total) }, true]
  ]
  const t = datos.totales
  return [
    cabeceraHoja(datos, "Facturación de " + datos.mes),
    h("p", {}, t.facturas + " facturas · base " + euros(t.base) + " · IVA " + euros(t.iva) + " · total " + euros(t.total)),
    h("h3", {}, "Por tipo de habitación"),
    tablaSimple([["Tipo", function (f) { return f.tipo }], ["Noches", function (f) { return f.noches }, true]].concat(importes), datos.por_tipo),
    h("h3", {}, "Por forma de pago"),
    tablaSimple([["Forma de pago", function (f) { return f.forma_pago }]].concat(importes), datos.por_pago)
  ]
}

function hojaFactura(datos) {
  const f = datos.factura
  return [
    cabeceraHoja(datos, "Factura " + f.numero),
    h("p", {}, "Fecha: " + fechaCorta(f.fecha)),
    h("p", {}, "Cliente: " + f.cliente + " · Documento " + f.dni_pasaporte + " · " + f.pais),
    tablaSimple([
      ["Concepto", function () { return "Alojamiento, habitación " + f.habitacion + " (" + f.tipo + "), del " + fechaCorta(f.fecha_entrada) + " al " + fechaCorta(f.fecha_salida) }],
      ["Noches", function () { return f.noches }, true],
      ["Importe", function () { return euros(f.base) }, true]
    ], [f]),
    h("dl", { class: "detalle totales" },
      h("dt", {}, "Base imponible"), h("dd", {}, euros(f.base)),
      h("dt", {}, "IVA " + f.iva_porcentaje + " %"), h("dd", {}, euros(f.iva)),
      h("dt", {}, "Total"), h("dd", {}, euros(f.total)),
      h("dt", {}, "Forma de pago"), h("dd", {}, f.forma_pago))
  ]
}

async function vistaInformes(escenario) {
  if (fechaInforme === "") { fechaInforme = hoy }
  if (mesInforme === "") { mesInforme = hoy.slice(0, 7) }

  let ruta = "011-informes.php?accion=" + tipoInforme
  if (tipoInforme === "parte") { ruta += "&fecha=" + fechaInforme }
  if (tipoInforme === "mensual") { ruta += "&mes=" + mesInforme }
  if (tipoInforme === "factura") { ruta += "&id=" + facturaInforme }
  const datos = await api(ruta)
  vaciar(escenario)

  // Controles (no salen en el papel)
  const opciones = [["parte", "Parte de recepción"], ["mensual", "Facturación mensual"]]
  if (tipoInforme === "factura") { opciones.push(["factura", "Factura"]) }
  const selector = h("select", { value: tipoInforme, "aria-label": "Tipo de informe", onchange: function (e) {
    tipoInforme = e.target.value
    recargarVista()
  } }, opciones.map(function (o) { return h("option", { value: o[0] }, o[1]) }))

  let fecha = null
  if (tipoInforme === "parte") {
    fecha = h("input", { type: "date", value: fechaInforme, "aria-label": "Fecha", onchange: function (e) { if (e.target.value) { fechaInforme = e.target.value; recargarVista() } } })
  }
  if (tipoInforme === "mensual") {
    fecha = h("input", { type: "month", value: mesInforme, "aria-label": "Mes", onchange: function (e) { if (e.target.value) { mesInforme = e.target.value; recargarVista() } } })
  }

  escenario.append(h("div", { class: "cabecera-vista no-imprimir" },
    h("div", {}, h("h2", {}, "Informes para imprimir"), h("p", {}, "En el diálogo de impresión se puede elegir «Guardar como PDF»")),
    h("div", { class: "fila-botones" }, selector, fecha,
      h("button", { class: "btn", type: "button", onclick: function () { window.print() } }, "Imprimir"))))

  const dibujar = { parte: hojaParte, mensual: hojaMensual, factura: hojaFactura }[tipoInforme]
  escenario.append(h("article", { class: "hoja" }, dibujar(datos), h("p", { class: "aviso-hoja" }, datos.emisor.aviso)))
}
