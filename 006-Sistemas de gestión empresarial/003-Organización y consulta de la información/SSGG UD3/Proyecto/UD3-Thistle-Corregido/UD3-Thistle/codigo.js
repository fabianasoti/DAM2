"use strict";

/* =========================================================
   THISTLE PMS-GMAO
   Gestión de entidades, formularios, tablas y exportaciones
   ========================================================= */

let tablaActual = "";
let clavePrimaria = "";

let datosTablaActual = {
    columnas: [],
    registros: [],
    clavePrimaria: ""
};

let registroEnEdicion = null;
let temporizadorBusqueda = null;

/* =========================================================
   1. INICIALIZACIÓN
   ========================================================= */

document.addEventListener("DOMContentLoaded", inicializarThistle);

async function inicializarThistle() {
    try {
        await cargarConfiguracion();
        await cargarModulos();
        await cargarEntidades();
        abrirDashboard();
    } catch (error) {
        console.error("Error al iniciar Thistle:", error);
        mostrarError(
            "No se ha podido iniciar la aplicación. Comprueba el servidor y la API."
        );
    }
}

/* =========================================================
   2. PETICIONES A LA API
   ========================================================= */

async function solicitarJSON(url, opciones = {}) {
    let respuesta;
    try {
        respuesta = await fetch(url, opciones);
    } catch (error) {
        throw new Error("No se pudo conectar con la API. Abre la aplicación desde un servidor PHP, no mediante file://.");
    }
    const texto = await respuesta.text();
    let datos;
    try {
        datos = JSON.parse(texto);
    } catch (error) {
        throw new Error(`La API no devolvió JSON válido (HTTP ${respuesta.status}). Comprueba PHP y la configuración del servidor.`);
    }
    if (datos && typeof datos === "object" && datos.ok === false) {
        throw new Error(datos.error || "La operación no se ha completado.");
    }
    if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
    }
    return datos;
}

async function enviarJSON(ruta, datos) {
    return solicitarJSON(`api/superapi.php?ruta=${encodeURIComponent(ruta)}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    });
}

/* =========================================================
   3. CONFIGURACIÓN
   ========================================================= */

async function cargarConfiguracion() {
    try {
        const datos = await solicitarJSON("data/config.php");

        if (datos.nombre) {
            document.querySelector("h1").textContent = datos.nombre;
        }

        if (datos.color) {
            document.documentElement.style.setProperty(
                "--color_corporativo",
                datos.color
            );
        }

        document.title = `${datos.nombre || "Thistle"} | PMS-GMAO`;
    } catch (error) {
        console.warn("No se ha podido cargar la configuración:", error);
    }
}

/* =========================================================
   4. MENÚ DE MÓDULOS
   ========================================================= */

async function cargarModulos() {
    const menu = document.querySelector("#modulos");

    if (!menu) return;

    try {
        const datos = await solicitarJSON(
            "api/superapi.php?ruta=modulos"
        );

        datos.forEach(modulo => {
            const enlace = document.createElement("a");

            enlace.href = "#";
            enlace.textContent = modulo;

            enlace.addEventListener("click", evento => {
                evento.preventDefault();
                mostrarMensaje(
                    `Módulo seleccionado: ${modulo}. Selecciona una entidad para consultar sus datos.`
                );
            });

            menu.appendChild(enlace);
        });
    } catch (error) {
        console.warn("No se han podido cargar los módulos:", error);
    }
}

/* =========================================================
   5. MENÚ DE ENTIDADES
   ========================================================= */

async function cargarEntidades() {
    const menu = document.querySelector("#entidades");

    if (!menu) return;

    try {
        const entidades = await solicitarJSON(
            "api/superapi.php?ruta=entidades"
        );

        menu.replaceChildren();

        entidades.forEach(entidad => {
            const enlace = document.createElement("a");

            enlace.href = "#";
            enlace.textContent = entidad;
            enlace.dataset.entidad = entidad;

            enlace.addEventListener("click", evento => {
                evento.preventDefault();

                document
                    .querySelectorAll("#entidades a")
                    .forEach(a => a.classList.remove("activo"));

                enlace.classList.add("activo");
                cargarTabla(entidad);
            });

            menu.appendChild(enlace);
        });
    } catch (error) {
        console.error("Error al cargar entidades:", error);
        mostrarError(`No se han podido cargar las entidades: ${error.message}`);
    }
}

/* =========================================================
   6. CARGA DE TABLAS
   ========================================================= */

async function cargarTabla(tabla) {
    tablaActual = tabla;

    mostrarCargando("Cargando datos...");

    try {
        const t0 = performance.now();
        const datos = await solicitarJSON(
            `api/superapi.php?ruta=tabla&tabla=${encodeURIComponent(tabla)}`
        );
        const ms = Math.round(performance.now() - t0);

        if (!datos || !Array.isArray(datos.columnas)) {
            throw new Error("La API no ha devuelto una estructura de tabla válida.");
        }

        clavePrimaria = datos.clavePrimaria || "";

        datosTablaActual = {
            columnas: datos.columnas,
            registros: Array.isArray(datos.registros)
                ? datos.registros
                : [],
            clavePrimaria,
            ms
        };

        pintarTabla(datosTablaActual);
    } catch (error) {
        console.error("Error al cargar la tabla:", error);
        mostrarError(`No se ha podido cargar ${tabla}: ${error.message}`);
    }
}

/* =========================================================
   7. VISUALIZACIÓN DE TABLAS
   ========================================================= */

function pintarTabla(datos) {
    const seccion = document.querySelector("section");
    if (!seccion) return;

    const columnas = datos.columnas || [];
    const registros = datos.registros || [];

    const barra = document.createElement("div");
    barra.className = "barra";

    const encabezado = document.createElement("div");

    const etiqueta = document.createElement("small");
    etiqueta.textContent = "ENTIDAD";

    const titulo = document.createElement("h2");
    titulo.textContent = tablaActual;

    encabezado.append(etiqueta, titulo);

    const acciones = document.createElement("div");
    acciones.className = "acciones-tabla";

    acciones.append(
        crearBoton("+ Nuevo registro", nuevoRegistro),
        crearBoton("Exportar CSV", exportarTablaCSV, "secundario"),
        crearBoton("Exportar JSON", exportarTablaJSON, "secundario"),
        crearBoton("Exportar MD", exportarTablaMD, "secundario"),
        crearBoton("Exportar HTML", exportarTablaHTML, "secundario"),
        crearBoton("Exportar SQL", exportarTablaSQL, "secundario"),
        crearBoton("Imprimir", () => window.print(), "secundario")
    );

    barra.append(encabezado, acciones);

    seccion.replaceChildren(barra);

    if (columnas.length === 0) {
        seccion.appendChild(crearMensaje("Esta entidad no tiene columnas."));
        return;
    }

    /* Buscador */
    const zonaBusqueda = document.createElement("div");
    zonaBusqueda.className = "zona-busqueda";

    const buscador = document.createElement("input");
    buscador.type = "search";
    buscador.id = "busqueda-tabla";
    buscador.placeholder = "Buscar en los registros...";
    buscador.setAttribute("aria-label", "Buscar registros");

    zonaBusqueda.appendChild(buscador);
    seccion.appendChild(zonaBusqueda);

    const resumen = document.createElement("p");
    resumen.id = "resumen-registros";
    resumen.className = "resumen-registros";
    seccion.appendChild(resumen);

    /* Gráfica por entidad (tipo y columna seleccionables) */
    const panel = document.createElement("div");
    panel.className = "grafica-card grafica-tabla";

    const selTipo = document.createElement("select");
    ["barras", "horizontal", "lineas", "anillo", "tarta"]
        .forEach(t => selTipo.add(new Option(t, t)));

    const selCol = document.createElement("select");
    columnas.filter(c => !c.pk).forEach(c => selCol.add(new Option(c.name, c.name)));

    const lienzo = document.createElement("div");

    const pintarGrafica = () => {
        const f = ThistleGraficas.frecuencia(registros, selCol.value);
        ThistleGraficas.crear(
            lienzo, selTipo.value,
            f.map(x => x[0]), f.map(x => x[1]),
            "Frecuencia de " + selCol.value
        );
    };

    selTipo.addEventListener("change", pintarGrafica);
    selCol.addEventListener("change", pintarGrafica);

    const campoInicial = ThistleGraficas.campo(registros, columnas);
    if (campoInicial) selCol.value = campoInicial.name;

    panel.append(selCol, selTipo, lienzo);

    if (registros.length && selCol.value) {
        seccion.appendChild(panel);
        pintarGrafica();
    }

    const contenedor = document.createElement("div");
    contenedor.className = "tabla-contenedor";

    const tablaHTML = document.createElement("table");
    tablaHTML.id = "tabla-registros";

    const thead = document.createElement("thead");
    const filaCabecera = document.createElement("tr");

    columnas.forEach(columna => {
        const th = document.createElement("th");
        th.textContent = columna.name;
        filaCabecera.appendChild(th);
    });

    const thAcciones = document.createElement("th");
    thAcciones.textContent = "Acciones";
    thAcciones.className = "acciones";
    filaCabecera.appendChild(thAcciones);

    thead.appendChild(filaCabecera);

    const tbody = document.createElement("tbody");

    tablaHTML.append(thead, tbody);
    contenedor.appendChild(tablaHTML);
    seccion.appendChild(contenedor);

    function renderizarFilas(filtro = "") {
        tbody.replaceChildren();

        const texto = filtro.trim().toLocaleLowerCase("es");

        const filtrados = registros.filter(registro =>
            columnas.some(columna =>
                String(registro[columna.name] ?? "")
                    .toLocaleLowerCase("es")
                    .includes(texto)
            )
        );

        resumen.textContent =
            `${filtrados.length} registro(s) mostrado(s) de ${registros.length} · consulta en ${datos.ms} ms.`;

        filtrados.forEach(registro => {
            const fila = document.createElement("tr");

            columnas.forEach(columna => {
                const td = document.createElement("td");
                td.textContent = registro[columna.name] ?? "";
                fila.appendChild(td);
            });

            const tdAcciones = document.createElement("td");
            tdAcciones.className = "acciones";

            const botonEditar = crearBoton(
                "Editar",
                () => editarRegistro(registro),
                "editar"
            );

            const botonEliminar = crearBoton(
                "Eliminar",
                () => eliminarRegistro(registro[datos.clavePrimaria]),
                "eliminar"
            );

            tdAcciones.append(botonEditar, botonEliminar);
            fila.appendChild(tdAcciones);
            tbody.appendChild(fila);
        });

        if (filtrados.length === 0) {
            const fila = document.createElement("tr");
            const celda = document.createElement("td");

            celda.colSpan = columnas.length + 1;
            celda.textContent = texto
                ? "No hay resultados para esta búsqueda."
                : "Todavía no hay registros.";

            fila.appendChild(celda);
            tbody.appendChild(fila);
        }
    }

    buscador.addEventListener("input", () => {
        clearTimeout(temporizadorBusqueda);

        temporizadorBusqueda = setTimeout(() => {
            renderizarFilas(buscador.value);
        }, 150);
    });

    renderizarFilas();
}

/* =========================================================
   8. FORMULARIOS: CREAR Y EDITAR
   ========================================================= */

function nuevoRegistro() {
    registroEnEdicion = null;
    cargarFormulario(null);
}

function editarRegistro(registro) {
    registroEnEdicion = registro;
    cargarFormulario(registro);
}

async function cargarFormulario(registro) {
    const seccion = document.querySelector("section");
    const editando = registro !== null;

    mostrarCargando("Preparando formulario...");

    try {
        const estructura = await solicitarJSON(
            `api/superapi.php?ruta=estructura&tabla=${encodeURIComponent(tablaActual)}`
        );

        const columnas = estructura.columnas || [];
        const pk = estructura.clavePrimaria || clavePrimaria;

        const barra = document.createElement("div");
        barra.className = "barra";

        const encabezado = document.createElement("div");
        const etiqueta = document.createElement("small");
        etiqueta.textContent = editando ? "EDITAR REGISTRO" : "NUEVO REGISTRO";

        const titulo = document.createElement("h2");
        titulo.textContent = tablaActual;

        encabezado.append(etiqueta, titulo);

        barra.append(
            encabezado,
            crearBoton("← Volver", () => cargarTabla(tablaActual), "secundario")
        );

        const formulario = document.createElement("form");
        formulario.id = "formulario";

        columnas.forEach(columna => {
            if (columna.pk) return;

            const nombre = columna.name;
            const nombreCol = nombre.toLowerCase();
            const valor = editando ? (registro[nombre] ?? "") : "";

            const etiquetaCampo = document.createElement("label");
            etiquetaCampo.appendChild(document.createTextNode(nombre));

            let control;

            if (nombreCol === "estado") {
                control = document.createElement("input");
                control.type = "text";
                control.placeholder = "Introduce el estado permitido";
            } else {
                control = document.createElement("input");
                control.type = determinarTipoCampo(nombreCol);
            }

            control.name = nombre;
            control.value = valor;
            control.autocomplete = "off";

            // Evitamos imponer reglas de negocio que desconocemos.
            // La API y SQLite deben validar los campos obligatorios.
            if (columna.notnull && !columna.pk) {
                control.required = true;
            }

            if (nombreCol.includes("email")) {
                control.placeholder = "usuario@ejemplo.com";
            } else if (nombreCol.includes("telefono")) {
                control.placeholder = "+34600000000";
            } else {
                control.placeholder = `Introduce ${nombre}`;
            }

            etiquetaCampo.appendChild(control);
            formulario.appendChild(etiquetaCampo);
        });

        const botonGuardar = document.createElement("button");
        botonGuardar.type = "submit";
        botonGuardar.textContent = editando
            ? "Guardar cambios"
            : "Crear registro";

        formulario.appendChild(botonGuardar);

        formulario.addEventListener("submit", async evento => {
            evento.preventDefault();

            const formData = new FormData(formulario);
            const datos = Object.fromEntries(formData.entries());

            await guardarRegistro(datos, editando ? registro[pk] : null);
        });

        seccion.replaceChildren(barra, formulario);
    } catch (error) {
        console.error("Error al generar el formulario:", error);
        mostrarError(`No se ha podido generar el formulario: ${error.message}`);
    }
}

function determinarTipoCampo(nombre) {
    if (nombre.includes("email")) return "email";

    if (
        nombre.includes("fecha") ||
        nombre.endsWith("_at")
    ) {
        return "text";
    }

    if (
        nombre.includes("precio") ||
        nombre.includes("importe") ||
        nombre.includes("cantidad") ||
        nombre.includes("numero") ||
        nombre.includes("total")
    ) {
        return "number";
    }

    return "text";
}

/* =========================================================
   9. GUARDAR REGISTROS
   ========================================================= */

async function guardarRegistro(datos, id) {
    try {
        const ruta = id === null ? "crear" : "actualizar";

        const respuesta = await enviarJSON(ruta, {
            tabla: tablaActual,
            id,
            datos
        });

        if (respuesta.ok === false) {
            throw new Error(respuesta.error || "No se ha podido guardar.");
        }

        mostrarMensaje(
            id === null
                ? "Registro creado correctamente."
                : "Registro actualizado correctamente."
        );

        await cargarTabla(tablaActual);
    } catch (error) {
        console.error("Error al guardar:", error);

        if (error.message.includes("UNIQUE constraint failed")) {
            mostrarError(
                "Ya existe un registro con ese valor. Comprueba los campos únicos."
            );
        } else {
            mostrarError(`No se ha podido guardar: ${error.message}`);
        }
    }
}

/* =========================================================
   10. ELIMINAR REGISTROS
   ========================================================= */

async function eliminarRegistro(id) {
    if (id === undefined || id === null) {
        mostrarError("No se ha encontrado el identificador del registro.");
        return;
    }

    if (!confirm("¿Seguro que quieres eliminar este registro?")) {
        return;
    }

    try {
        const respuesta = await enviarJSON("eliminar", {
            tabla: tablaActual,
            id
        });

        if (respuesta.ok === false) {
            throw new Error(respuesta.error || "No se ha podido eliminar.");
        }

        mostrarMensaje("Registro eliminado correctamente.");
        await cargarTabla(tablaActual);
    } catch (error) {
        console.error("Error al eliminar:", error);
        mostrarError(`No se ha podido eliminar: ${error.message}`);
    }
}

/* =========================================================
   11. EXPORTACIÓN CSV
   ========================================================= */

function exportarTablaCSV() {
    const { columnas, registros } = datosTablaActual;

    if (!columnas.length) {
        mostrarError("No hay datos para exportar.");
        return;
    }

    // Usa el módulo común: evita que Excel interprete datos como fórmulas
    ThistleCSV.descargar(tablaActual, columnas, registros);
}

/* =========================================================
   12. EXPORTACIÓN JSON
   ========================================================= */

function exportarTablaJSON() {
    const contenido = JSON.stringify({
        entidad: tablaActual,
        fechaExportacion: new Date().toISOString(),
        totalRegistros: datosTablaActual.registros.length,
        registros: datosTablaActual.registros
    }, null, 2);

    descargarArchivo(
        contenido,
        `${nombreArchivo(tablaActual)}.json`,
        "application/json;charset=utf-8;"
    );
}

/* =========================================================
   12 bis. EXPORTACIÓN MARKDOWN, HTML Y SQL
   ========================================================= */

function exportarTablaMD() {
    const { columnas, registros } = datosTablaActual;
    if (!columnas.length) return mostrarError("No hay datos para exportar.");

    const cel = v => String(v ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");

    const md = [
        `# ${tablaActual}`,
        "",
        `Exportado: ${new Date().toLocaleString("es-ES")} · ${registros.length} registros`,
        "",
        "| " + columnas.map(c => cel(c.name)).join(" | ") + " |",
        "| " + columnas.map(() => "---").join(" | ") + " |",
        ...registros.map(r => "| " + columnas.map(c => cel(r[c.name])).join(" | ") + " |")
    ].join("\n");

    descargarArchivo(md, `${nombreArchivo(tablaActual)}.md`, "text/markdown;charset=utf-8;");
}

function exportarTablaHTML() {
    const { columnas, registros } = datosTablaActual;
    if (!columnas.length) return mostrarError("No hay datos para exportar.");

    const th = columnas.map(c => `<th>${escapar(c.name)}</th>`).join("");
    const filas = registros
        .map(r => `<tr>${columnas.map(c => `<td>${escapar(r[c.name])}</td>`).join("")}</tr>`)
        .join("\n");

    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapar(tablaActual)}</title><style>body{font-family:sans-serif}table{border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px}th{background:#4a3b4c;color:#fff}</style></head><body><h1>${escapar(tablaActual)}</h1><table><thead><tr>${th}</tr></thead><tbody>${filas}</tbody></table></body></html>`;

    descargarArchivo(html, `${nombreArchivo(tablaActual)}.html`, "text/html;charset=utf-8;");
}

function exportarTablaSQL() {
    const { columnas, registros } = datosTablaActual;
    if (!columnas.length) return mostrarError("No hay datos para exportar.");

    const q = v => (v === null || v === undefined) ? "NULL" : "'" + String(v).replace(/'/g, "''") + "'";
    const nombres = columnas.map(c => `"${c.name}"`).join(", ");

    const sql = registros
        .map(r => `INSERT INTO "${tablaActual}" (${nombres}) VALUES (${columnas.map(c => q(r[c.name])).join(", ")});`)
        .join("\n");

    descargarArchivo(sql, `${nombreArchivo(tablaActual)}.sql`, "application/sql;charset=utf-8;");
}

/* =========================================================
   13. DESCARGA DE ARCHIVOS
   ========================================================= */

function descargarArchivo(contenido, nombre, tipo) {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function nombreArchivo(nombre) {
    return String(nombre)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
}

/* =========================================================
   14. COMPONENTES DE INTERFAZ
   ========================================================= */

function crearBoton(texto, accion, clase = "") {
    const boton = document.createElement("button");

    boton.type = "button";
    boton.textContent = texto;

    if (clase) {
        boton.className = clase;
    }

    boton.addEventListener("click", accion);

    return boton;
}

function crearMensaje(texto) {
    const mensaje = document.createElement("p");
    mensaje.className = "vacio";
    mensaje.textContent = texto;
    return mensaje;
}

function mostrarCargando(texto) {
    const seccion = document.querySelector("section");
    if (!seccion) return;

    seccion.replaceChildren(crearMensaje(texto));
}

function mostrarMensaje(texto) {
    console.info("[Thistle]", texto);
    mostrarAviso(texto, "correcto");
}

function mostrarError(texto) {
    console.error("[Thistle]", texto);
    mostrarAviso(texto, "error");
}

function mostrarAviso(texto, tipo) {
    let aviso = document.querySelector("#aviso-thistle");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "aviso-thistle";
        aviso.setAttribute("role", "status");

        const contenedor = document.querySelector("main") || document.body;
        contenedor.prepend(aviso);
    }

    aviso.className = `aviso-thistle ${tipo}`;
    aviso.textContent = texto;
}

/* =========================================================
   15. UTILIDADES DE ESCAPADO
   ========================================================= */

function escapar(valor) {
    const elemento = document.createElement("div");
    elemento.textContent = String(valor ?? "");
    return elemento.innerHTML;
}

function escaparAtributo(valor) {
    return escapar(valor)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}



function abrirDashboard() {
    const dashboard = new ThistleDashboard("section");
    dashboard.render();
}

document.addEventListener("DOMContentLoaded", () => {
    const enlace = document.querySelector("#enlace-dashboard");

    if (enlace) {
        enlace.addEventListener("click", evento => {
            evento.preventDefault();
            abrirDashboard();
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#boton-reporting")?.addEventListener("click", () => {
        document
            .querySelectorAll("#entidades a")
            .forEach(a => a.classList.remove("activo"));

        new ThistleReporting({ contenedor: "section" }).render();
    });
});