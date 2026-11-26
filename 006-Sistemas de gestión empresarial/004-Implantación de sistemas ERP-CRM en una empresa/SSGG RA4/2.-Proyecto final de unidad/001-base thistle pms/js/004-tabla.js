// Tabla y formulario genéricos para las entidades de api/003-entidades.php
// (clientes, habitaciones, temporadas, usuarios y auditoría), más la vista de exportación

// Texto que se muestra en una celda según el tipo de campo
function textoCelda(campo, valor, relaciones) {
  if (valor === null || valor === undefined || valor === "") { return "" }
  if (campo[1] === "fk") { return (relaciones[campo[0]] || {})[valor] || valor }
  if (campo[0] === "activo") { return String(valor) === "1" ? "Sí" : "No" }
  if (campo[1] === "numero" && campo[0].includes("precio")) { return euros(valor) }
  if (campo[1] === "fecha") { return fechaCorta(valor) }
  return valor
}

async function vistaEntidad(escenario, nombre) {
  const datos = await api("004-crud.php?entidad=" + nombre)
  const entidad = datos.entidad
  const columnas = entidad.campos.filter(function (c) { return c[1] !== "password" })
  let registros = datos.registros
  let orden = { campo: null, descendente: false }
  vaciar(escenario)

  const cuerpo = h("tbody", {})
  const cabecera = h("tr", {})

  const pintarCuerpo = function () {
    vaciar(cuerpo)
    const lista = registros.slice()
    if (orden.campo) {
      lista.sort(function (a, b) {
        const x = a[orden.campo], y = b[orden.campo]
        const resultado = (typeof x === "number" && typeof y === "number") ? x - y : String(x ?? "").localeCompare(String(y ?? ""), "es")
        return orden.descendente ? -resultado : resultado
      })
    }
    lista.forEach(function (registro) {
      cuerpo.append(h("tr", { class: "fila", onclick: function () { abrirFormularioEntidad(entidad, registro, datos.relaciones) } },
        columnas.map(function (c) {
          const texto = textoCelda(c, registro[c[0]], datos.relaciones)
          const numerico = c[1] === "numero"
          return h("td", { class: numerico ? "num" : "" }, c[0] === "estado" && texto ? etiquetaEstado(texto) : texto)
        })))
    })
    activarBuscador(cuerpo)
  }

  columnas.forEach(function (c) {
    const th = h("th", { class: c[1] === "numero" ? "num" : "", onclick: function () {
      orden = { campo: c[0], descendente: orden.campo === c[0] && !orden.descendente }
      cabecera.querySelectorAll("th").forEach(function (t) { t.removeAttribute("aria-sort") })
      th.setAttribute("aria-sort", orden.descendente ? "descending" : "ascending")
      pintarCuerpo()
    } }, c[2])
    cabecera.append(th)
  })

  const botones = []
  if (entidad.puede_escribir) {
    botones.push(h("button", { class: "btn", type: "button", onclick: function () { abrirFormularioEntidad(entidad, null, datos.relaciones) } }, "Nuevo"))
  }
  botones.push(h("a", { class: "btn secundario", href: "servicios/003-salida.php?tabla=" + nombre + "&formato=csv", download: "" }, "Exportar CSV"))
  botones.push(h("a", { class: "btn secundario", href: "servicios/003-salida.php?tabla=" + nombre + "&formato=json", download: "" }, "JSON"))
  if (nombre === "clientes") {
    const archivo = h("input", { type: "file", accept: ".csv,text/csv", class: "oculto", onchange: function (e) { importarClientes(e.target.files[0]) } })
    botones.push(archivo, h("button", { class: "btn secundario", type: "button", onclick: function () { archivo.click() } }, "Importar CSV"))
  }

  escenario.append(
    h("div", { class: "cabecera-vista" },
      h("div", {}, h("h2", {}, entidad.etiqueta), h("p", {}, entidad.puede_escribir ? "Pulsa una fila para editarla" : "Solo lectura")),
      h("div", { class: "fila-botones" }, botones)),
    h("div", { class: "tabla-caja" }, h("table", {}, h("thead", {}, cabecera), cuerpo)))
  pintarCuerpo()
}

// Panel con el formulario de una entidad (crear o editar)
function abrirFormularioEntidad(entidad, registro, relaciones) {
  const editando = registro !== null
  const solo_lectura = !entidad.puede_escribir
  const controles = {}

  const campos = entidad.campos.filter(function (c) { return !(c[4].solo_lectura && !editando) }).map(function (c) {
    const [clave, tipo, etiqueta, requerido, extra] = c
    const valorActual = editando && tipo !== "password" ? registro[clave] : ""
    let control
    if (tipo === "select") {
      control = h("select", { value: valorActual === null ? "" : String(valorActual) },
        extra.opciones.map(function (o) { return h("option", { value: o }, clave === "activo" ? (o === "1" ? "Sí" : "No") : o) }))
    } else if (tipo === "fk") {
      control = h("input", { value: textoCelda(c, valorActual, relaciones), disabled: true })
    } else {
      const atributos = { type: tipo === "numero" ? "number" : tipo === "fecha" ? "date" : tipo === "email" ? "email" : tipo === "password" ? "password" : "text",
        value: valorActual === null ? "" : valorActual, maxlength: tipo === "texto" || tipo === "email" ? 120 : null,
        min: extra.min, max: extra.max, step: tipo === "numero" ? (extra.entero ? 1 : "any") : null,
        autocomplete: tipo === "password" ? "new-password" : null,
        placeholder: tipo === "password" && editando ? "Déjala vacía para no cambiarla" : null }
      control = h("input", atributos)
    }
    if (solo_lectura || extra.solo_lectura) { control.disabled = true }
    controles[clave] = { control: control, tipo: tipo }
    return h("label", {}, h("span", {}, etiqueta + (requerido ? " *" : "")), control)
  })

  const error = h("p", { class: "error-form", role: "alert" })
  const pie = [h("button", { class: "btn secundario", type: "button", onclick: cerrarPanel }, solo_lectura ? "Cerrar" : "Cancelar")]

  if (editando && entidad.puede_borrar) {
    pie.unshift(h("button", { class: "btn secundario", type: "button", onclick: async function () {
      const seguro = await confirmar("Borrar registro", "Se borrará de forma definitiva. Si tiene datos relacionados, no se podrá borrar.", "Borrar", true)
      if (!seguro) { return }
      try {
        await api("004-crud.php?accion=borrar", { entidad: entidad.nombre, id: registro.id })
        toast("exito", "Registro borrado")
        cerrarPanel()
        recargarVista()
      } catch (e) { error.textContent = e.message }
    } }, "Borrar"))
  }
  if (!solo_lectura) {
    pie.push(h("button", { class: "btn", type: "button", onclick: async function () {
      error.textContent = ""
      const datos = {}
      for (const clave in controles) {
        if (controles[clave].control.disabled) { continue }
        datos[clave] = controles[clave].control.value
      }
      try {
        await api("004-crud.php?accion=guardar", { entidad: entidad.nombre, id: editando ? registro.id : undefined, datos: datos })
        toast("exito", editando ? "Cambios guardados" : "Registro creado")
        cerrarPanel()
        recargarVista()
      } catch (e) { error.textContent = e.message }
    } }, "Guardar"))
  }

  abrirPanel({
    etiqueta: editando ? "EDITAR" : "CREAR", titulo: editando ? entidad.etiqueta : "Nuevo registro",
    cuerpo: h("div", { class: "form" }, campos, error), pie: pie
  })
}

// Importar clientes desde un archivo CSV (servicios/002-entrada.php)
async function importarClientes(archivo) {
  if (!archivo) { return }
  if (archivo.size > 200000) { toast("error", "Archivo demasiado grande", "El máximo es 200 KB"); return }
  try {
    const texto = await archivo.text()
    const r = await api("servicios/002-entrada.php", { csv: texto })
    const rechazados = r.rechazados.map(function (x) { return h("li", {}, "Línea " + x.linea + ": " + x.motivo) })
    abrirPanel({
      etiqueta: "IMPORTACIÓN", titulo: r.insertados + " clientes importados",
      cuerpo: [h("p", {}, r.rechazados.length === 0 ? "Todas las filas eran correctas." : r.rechazados.length + " filas no se han importado:"),
        rechazados.length ? h("ul", {}, rechazados) : null],
      pie: [h("button", { class: "btn", type: "button", onclick: function () { cerrarPanel(); recargarVista() } }, "Aceptar")]
    })
  } catch (error) { mostrarError(error) }
}

// Vista de exportación: una fila por tabla con enlaces de descarga
async function vistaExportar(escenario) {
  vaciar(escenario)
  const tablas = [["reservas", "Reservas"], ["clientes", "Clientes"], ["habitaciones", "Habitaciones"], ["temporadas", "Temporadas"], ["mantenimiento", "Partes de mantenimiento y limpieza"]]
  if (usuario.rol === "admin") { tablas.push(["usuarios", "Usuarios (sin contraseñas)"], ["auditoria", "Auditoría"]) }
  escenario.append(
    h("div", { class: "cabecera-vista" }, h("div", {}, h("h2", {}, "Exportar datos"),
      h("p", {}, "Descarga cualquier tabla en CSV (para Excel) o JSON. Las contraseñas nunca se exportan."))),
    h("div", { class: "tabla-caja" }, h("table", {},
      h("thead", {}, h("tr", {}, h("th", {}, "Tabla"), h("th", {}, "Descargar"))),
      h("tbody", {}, tablas.map(function (t) {
        return h("tr", {}, h("td", {}, t[1]), h("td", {}, h("div", { class: "fila-botones" },
          h("a", { class: "btn pequeno secundario", href: "servicios/003-salida.php?tabla=" + t[0] + "&formato=csv", download: "" }, "CSV"),
          h("a", { class: "btn pequeno secundario", href: "servicios/003-salida.php?tabla=" + t[0] + "&formato=json", download: "" }, "JSON"))))
      })))),
    h("p", { class: "ayuda", style: "margin-top: 14px" }, "Además, servicios/004-exportar programado.php genera una copia completa cada vez que se ejecuta (por ejemplo, con cron), con su registro."))
}
