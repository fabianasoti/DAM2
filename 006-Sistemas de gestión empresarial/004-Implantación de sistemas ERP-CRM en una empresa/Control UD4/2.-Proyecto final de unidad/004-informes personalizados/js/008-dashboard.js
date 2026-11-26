// Dashboard de indicadores hoteleros. Todas las cifras salen de consultas SQL (api/008-kpis.php).

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function nombreMes(iso) {
  return MESES[parseInt(iso.slice(5, 7)) - 1]
}

function tarjetaKpi(titulo, valor, detalle) {
  return h("div", { class: "kpi" }, h("small", {}, titulo), h("strong", {}, valor), h("span", {}, detalle))
}

// Una gráfica dentro de su tarjeta, con una línea que explica cómo se calcula
function tarjetaGrafica(titulo, formula, dibujar, leyenda) {
  const caja = h("div", { class: "grafica" }, h("h3", {}, titulo), h("p", { class: "formula" }, formula))
  dibujar(caja)
  if (leyenda) { caja.append(leyenda) }
  return caja
}

async function vistaDashboard(escenario) {
  const k = await api("008-kpis.php")
  vaciar(escenario)

  const meses = k.mensual
  const etiquetas = meses.map(function (m) { return nombreMes(m.mes) })
  const actual = meses[meses.length - 1]
  const ahora = k.ahora

  escenario.append(h("div", { class: "cabecera-vista" },
    h("div", {}, h("h2", {}, "Dashboard"), h("p", {}, "Situación de hoy (" + fechaCorta(k.hoy) + ") y evolución de los últimos 12 meses"))))

  escenario.append(h("div", { class: "kpis" },
    tarjetaKpi("Ocupación hoy", ahora.ocupacion + " %", ahora.estados.ocupada + " de " + k.habitaciones + " habitaciones"),
    tarjetaKpi("Llegadas hoy", ahora.llegadas, "pendientes de check-in"),
    tarjetaKpi("Salidas hoy", ahora.salidas, "pendientes de check-out"),
    tarjetaKpi("Huéspedes en casa", ahora.huespedes, "con check-in hecho"),
    tarjetaKpi("Ocupación de " + nombreMes(actual.mes), actual.ocupacion + " %", "incluye reservas confirmadas"),
    tarjetaKpi("ADR de " + nombreMes(actual.mes), euros(actual.adr), "precio medio por noche vendida"),
    tarjetaKpi("RevPAR de " + nombreMes(actual.mes), euros(actual.revpar), "ingresos por habitación disponible"),
    tarjetaKpi("Cancelaciones", k.cancelaciones.porcentaje + " %", k.cancelaciones.canceladas + " de " + k.cancelaciones.total + " reservas (12 meses)"),
    tarjetaKpi("Averías abiertas", ahora.averias, ahora.urgentes + " urgentes")))

  const porcentaje = function (v) { return Math.round(v) + " %" }
  const dinero = function (v) { return v >= 1000 ? Math.round(v / 1000) + " k€" : Math.round(v) + " €" }
  const graficas = h("div", { class: "graficas" })

  graficas.append(tarjetaGrafica("Ocupación mensual", "Noches ocupadas ÷ (habitaciones × días del mes)",
    function (caja) { Graficas.barras(caja, etiquetas, [{ nombre: "Ocupación", valores: meses.map(function (m) { return m.ocupacion }), color: "var(--blackthorn-berry)" }], porcentaje, 100) }))

  graficas.append(tarjetaGrafica("Ingresos mensuales", "Importe de cada reserva repartido entre sus noches",
    function (caja) { Graficas.barras(caja, etiquetas, [{ nombre: "Ingresos", valores: meses.map(function (m) { return m.ingresos }), color: "var(--foxglove-strong)" }], dinero) }))

  const seriesPrecio = [
    { nombre: "ADR", valores: meses.map(function (m) { return m.adr }), color: "var(--blackthorn-berry)" },
    { nombre: "RevPAR", valores: meses.map(function (m) { return m.revpar }), color: "var(--foxglove-strong)" }
  ]
  graficas.append(tarjetaGrafica("ADR y RevPAR", "ADR = ingresos ÷ noches ocupadas · RevPAR = ingresos ÷ noches disponibles",
    function (caja) { Graficas.lineas(caja, etiquetas, seriesPrecio, function (v) { return Math.round(v) + " €" }) },
    Graficas.leyenda(seriesPrecio)))

  graficas.append(tarjetaGrafica("Ingresos por canal", "Reservas no canceladas de los últimos 12 meses",
    function (caja) {
      Graficas.anillo(caja, k.canales.map(function (c) { return { etiqueta: c.canal, valor: c.ingresos } }), dinero)
    }))

  const proximos = k.proximos
  graficas.append(tarjetaGrafica("Habitaciones ocupadas en los próximos 14 días", "Reservas activas que incluyen esa noche",
    function (caja) {
      Graficas.barras(caja, proximos.map(function (p) { return p.fecha.slice(8, 10) }),
        [{ nombre: "Ocupadas", valores: proximos.map(function (p) { return p.ocupadas }), color: "var(--willow-leaf)" }],
        function (v) { return Math.round(v) }, k.habitaciones)
    }))

  const tipos = h("div", { class: "grafica" }, h("h3", {}, "Tipos de habitación"),
    h("p", { class: "formula" }, "Últimos 12 meses"),
    h("div", { class: "tabla-caja" }, h("table", {},
      h("thead", {}, h("tr", {}, h("th", {}, "Tipo"), h("th", { class: "num" }, "Noches"), h("th", { class: "num" }, "Ingresos"))),
      h("tbody", {}, k.tipos.map(function (t) {
        return h("tr", {}, h("td", {}, t.tipo), h("td", { class: "num" }, t.noches), h("td", { class: "num" }, euros(t.ingresos)))
      })))))
  graficas.append(tipos)

  escenario.append(graficas)
}
