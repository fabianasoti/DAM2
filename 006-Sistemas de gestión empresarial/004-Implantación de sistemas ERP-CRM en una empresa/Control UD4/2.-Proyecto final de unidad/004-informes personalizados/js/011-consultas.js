// Pantalla "Clientes y países": muestra las vistas v_clientes_resumen y v_paises

// Crea una tabla. columnas: [título, función que saca el valor, ¿es número?]
function tablaSimple(columnas, filas) {
  return h("div", { class: "tabla-caja" }, h("table", {},
    h("thead", {}, h("tr", {}, columnas.map(function (c) { return h("th", { class: c[2] ? "num" : "" }, c[0]) }))),
    h("tbody", {}, filas.map(function (fila) {
      return h("tr", {}, columnas.map(function (c) { return h("td", { class: c[2] ? "num" : "" }, c[1](fila)) }))
    }))))
}

async function vistaConsultas(escenario) {
  const datos = await api("009-consultas.php")
  vaciar(escenario)

  escenario.append(h("div", { class: "cabecera-vista" }, h("div", {},
    h("h2", {}, "Clientes y países"), h("p", {}, "De dónde vienen los huéspedes y quién se aloja más"))))

  escenario.append(h("h3", {}, "Por país de procedencia"))
  escenario.append(tablaSimple([
    ["País", function (f) { return f.pais }],
    ["Reservas", function (f) { return f.reservas }, true],
    ["Noches", function (f) { return f.noches }, true],
    ["Ingresos", function (f) { return euros(f.ingresos) }, true]
  ], datos.paises))

  escenario.append(h("h3", {}, "50 clientes con más gasto"))
  escenario.append(tablaSimple([
    ["Cliente", function (f) { return f.cliente }],
    ["País", function (f) { return f.pais }],
    ["Estancias", function (f) { return f.estancias }, true],
    ["Noches", function (f) { return f.noches }, true],
    ["Gasto", function (f) { return euros(f.gasto) }, true],
    ["Última visita", function (f) { return fechaCorta(f.ultima_visita) }]
  ], datos.clientes))

  document.querySelector("#estadoRegistros").textContent = datos.clientes.length + " clientes"
}
