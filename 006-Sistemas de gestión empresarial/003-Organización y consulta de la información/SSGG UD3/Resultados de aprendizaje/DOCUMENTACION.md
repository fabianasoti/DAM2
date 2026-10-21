# Thistle PMS-GMAO · Documentación UD3

Sistema de gestión hotelera (PMS) y mantenimiento (GMAO) sobre PHP + SQLite + JavaScript.
Entidades: `usuarios`, `habitaciones`, `clientes`, `reservas`, `mantenimiento`.

---

## 1. Qué se ha hecho respecto a la versión base (022)

La versión 022 aportaba un módulo de dashboard, gráficas y reporting. En UD3 se ha adaptado al dominio hotelero y se ha ampliado.

### Extensiones visuales
| Extensión | Archivo | Descripción |
|---|---|---|
| Dashboard con KPIs reales | `nucleo/dashboard.js` | Ocupación, reservas, incidencias y total de registros calculados desde la base de datos |
| 5 tipos de gráfica | `nucleo/graficas.js` | Barras, barras horizontales, líneas, anillo y tarta (SVG propio, con tooltip) |
| Gráfica por entidad | `codigo.js` | Selector de tipo de gráfica y de columna en cada tabla |
| Reporte A4 | `nucleo/reporting.js` | Informe de todas las tablas con filtros, ordenación, totales y gráfica por tabla |
| Impresión / PDF | `estilo.css` | Reglas `@media print` para imprimir el reporte |
| Paleta Thistle | `nucleo/graficas.js`, `estilo.css` | Colores corporativos tipo cardo |

### Extensiones funcionales
| Extensión | Archivo | Descripción |
|---|---|---|
| CRUD completo | `codigo.js`, `api/superapi.php` | Crear, editar, eliminar y buscar registros |
| Exportación a 5 formatos | `codigo.js`, `nucleo/csv.js` | CSV, JSON, Markdown, HTML y SQL |
| Medición de rendimiento | `codigo.js` | Tiempo de cada consulta, visible en el resumen de la tabla |
| Exportación programada | `servicios/exportar_programado.php` | CSV de cada tabla y JSON completo, con log |
| Servicio de salida | `servicios/salida.php` | Devuelve toda la base de datos en JSON |
| Servicio de entrada | `servicios/entrada.php` | Importa registros desde JSON, con modo de prueba |

---

## 2. Resultado de aprendizaje 3: cumplimiento

| Criterio | Cómo se cumple | Dónde |
|---|---|---|
| a) Herramientas y lenguajes de consulta y manipulación | SQL sobre SQLite desde PHP con sentencias preparadas; rutas `tabla`, `crear`, `actualizar`, `eliminar` | `api/superapi.php` |
| b) Formularios | Formulario generado dinámicamente a partir de la estructura de cada tabla, para crear y editar | `cargarFormulario()` en `codigo.js` |
| c) Informes | Reporte A4 de todas las tablas y dashboard | `nucleo/reporting.js`, `nucleo/dashboard.js` |
| d) Exportar datos e informes | CSV, JSON, MD, HTML, SQL por tabla; reporte a PDF desde el navegador | `codigo.js`, botón Reporting |
| e) Automatizar extracciones | Script programado con cron o Programador de tareas; servicio `salida.php`; importación con `entrada.php` | `servicios/` |
| f) Rendimiento | Tiempo de consulta por tabla; tiempo de cada ejecución programada en `log.txt` | `codigo.js`, `data/exportaciones/log.txt` |
| g) Documentación de operaciones e incidencias | Este documento | `DOCUMENTACION.md` |
| h) Información relevante | KPIs de ocupación, estados, tipos y prioridades de mantenimiento | Dashboard |

---

## 3. Cómo usar los servicios automáticos

### 3.1 Exportación programada
Ejecución manual de prueba:
```
php servicios/exportar_programado.php
```
Resultado en `data/exportaciones/`: un CSV por tabla, un JSON completo y `log.txt`.

Programarla cada día a las 02:00:

- **Linux / Mac (cron):** `crontab -e` y añadir
  ```
  0 2 * * * php /ruta/completa/UD3-Thistle/servicios/exportar_programado.php
  ```
- **Windows (Programador de tareas):**
  ```
  schtasks /create /sc daily /st 02:00 /tn "Thistle Exportacion" /tr "php C:\ruta\UD3-Thistle\servicios\exportar_programado.php"
  ```

Las exportaciones de más de 30 días se borran solas.

### 3.2 Importación (`entrada.php`)
Acepta un JSON con el mismo formato que devuelve `salida.php`:
```json
{
  "habitaciones": [
    {"numero": "701", "tipo": "Doble", "precio_noche": 95, "estado": "disponible"}
  ]
}
```
Primero, en modo prueba (no guarda nada):
```
curl -X POST "http://localhost/UD3-Thistle/servicios/entrada.php?modo=prueba" -H "Content-Type: application/json" -d @datos.json
```
Después, la importación real, sin `?modo=prueba`.

La respuesta indica cuántos registros se insertaron por tabla y qué filas fallaron y por qué (por ejemplo, un valor duplicado en un campo `UNIQUE`).

**Limitaciones:** el `id` se genera automáticamente, así que las claves ajenas (por ejemplo `habitacion_id` en `reservas`) deben apuntar a ids que ya existan. El servicio no tiene autenticación: en un entorno real habría que protegerlo.

---

## 4. Registro de incidencias

| Nº | Incidencia observada | Causa | Solución |
|---|---|---|---|
| 1 | El dashboard no cargaba | `dashboard.js` llamaba a `ThistleGraficas`, que no existía (la clase era `DarkorangeGraficas`) | Se renombró la clase a `ThistleGraficas` en todos los archivos |
| 2 | Error por variable `f` no definida y gráfica `#dg4` pintada dos veces | Código mezclado de dos versiones en `dashboard.js` | Se reescribió el bloque de gráficas |
| 3 | `reg is not defined` / `Cannot access 'reg' before initialization` | Se usaba `reg` antes de declararla | Se reordenaron los cálculos antes de pintar el HTML |
| 4 | Dashboard y reporte sin estilos | `estilo.css` no tenía las reglas de dashboard, gráficas, reporting ni impresión | Se copiaron y adaptaron desde 022 |
| 5 | Reporte con nombres de tabla vacíos | La ruta `tabla` de la API no devolvía la clave `tabla` | Se añadió `'tabla'=>$tabla` en `superapi.php` |
| 6 | El enlace Dashboard desaparecía del menú | `cargarModulos()` hacía `replaceChildren()` sobre `#modulos` | Se eliminó esa línea |
| 7 | El dashboard se cargaba dos veces al iniciar | `abrirDashboard()` estaba llamada en dos funciones | Se dejó una única llamada en `inicializarThistle()` |
| 8 | Botón Reporting: `ThistleReporting is not defined` | La clase seguía llamándose `DarkorangeReporting` | Se renombraron todas las clases `Darkorange*` a `Thistle*` |
| 9 | El reporte mostraba contraseñas en texto plano y una gráfica "Frecuencia de password" | El reporte volcaba todas las columnas; la gráfica elegía cualquier columna | Se enmascara `password` en el reporte y se excluyen columnas sensibles de las gráficas |
| 10 | **Pendiente:** las contraseñas están sin cifrar en la base de datos y se ven en la tabla `usuarios` | Datos de demostración con contraseñas como `1234` | Recomendado: guardar hashes (`password_hash`) y ocultar la columna en la vista de tabla |
| 11 | Posible inyección de fórmulas al abrir el CSV en Excel | El CSV propio no neutralizaba valores que empiezan por `=`, `+`, `-` o `@` | `exportarTablaCSV()` usa ahora `ThistleCSV`, que los neutraliza |

---

## 5. Mediciones de rendimiento

Rellenar con los valores reales del equipo donde se ejecute (el tiempo aparece en el resumen de cada tabla: "consulta en X ms").

| Entidad | Registros | Tiempo de consulta (ms) |
|---|---|---|
| usuarios | 22 | |
| habitaciones | 50 | |
| clientes | 36 | |
| reservas | 36 | |
| mantenimiento | 4 | |

Exportación programada (copiar de `data/exportaciones/log.txt`):

| Fecha | Tablas | Registros | Segundos |
|---|---|---|---|
| | | | |

---

## 6. Evidencias

Capturas a incluir:

- [ ] Dashboard con KPIs y las 4 gráficas
- [ ] Gráfica por entidad con los 5 tipos
- [ ] Reporte A4 (y su vista previa de impresión)
- [ ] Descarga de los 5 formatos de exportación
- [ ] Tarea programada creada (cron o Programador de tareas)
- [ ] Contenido de `data/exportaciones/` y de `log.txt`
- [ ] Respuesta de `entrada.php` en modo prueba y en modo real
