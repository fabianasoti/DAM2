// Pantalla de integración con darkorange

async function vistaIntegracion(escenario) {
  const datos = await api("012-integracion.php")
  vaciar(escenario)

  const enviar = h("button", { class: "btn", type: "button", onclick: async function () {
    enviar.disabled = true
    try {
      const r = await api("012-integracion.php?accion=enviar", {})
      toast("exito", "Envío terminado", r.enviadas_ahora + " facturas enviadas a darkorange")
    } catch (error) {
      mostrarError(error)
    }
    recargarVista()
  } }, "Enviar siguientes facturas")
  enviar.disabled = !datos.conectado || datos.pendientes === 0

  escenario.append(
    h("div", { class: "cabecera-vista" }, h("div", {}, h("h2", {}, "Integración con darkorange"),
      h("p", {}, "Envía clientes y facturas al otro sistema de gestión")), enviar),
    h("div", { class: "kpis" },
      tarjetaKpi("Conexión", datos.conectado ? "Disponible" : "Sin respuesta", datos.url),
      tarjetaKpi("Facturas enviadas", datos.enviadas, "ya están en darkorange"),
      tarjetaKpi("Facturas pendientes", datos.pendientes, "se envían de 25 en 25")))
}
