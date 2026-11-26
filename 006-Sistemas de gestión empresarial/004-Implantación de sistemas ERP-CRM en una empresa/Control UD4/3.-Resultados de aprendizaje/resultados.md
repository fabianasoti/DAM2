# Resultados de aprendizaje - Sistemas de gestión empresarial

**Resultado de aprendizaje 4:** Adapta sistemas ERP-CRM identificando los requerimientos de un supuesto empresarial y utilizando las herramientas proporcionadas por los mismos.

Las rutas de evidencia son relativas a la carpeta de la entrega (`Control UD4`).

Supuesto empresarial: el Hotel Cardo Marino (ficticio, en Valencia) necesita gestionar reservas, recepción, limpieza, mantenimiento y facturación. Mi sistema es Thistle PMS.

---

### RA 4 - Criterio a
**Pregunta / criterio:** a) Se han identificado las posibilidades de adaptación del ERP-CRM.

**Respuesta:** Identifiqué qué se puede adaptar sin rehacer el sistema: la configuración, los campos y permisos de cada formulario, el esquema de la base de datos, los menús, los informes, los paneles y la conexión con otro sistema.

**Evidencia:** `2.-Proyecto final de unidad/008-pruebas y documentacion/documentacion/001-documentacion.md`

---

### RA 4 - Criterio b
**Pregunta / criterio:** b) Se han adaptado definiciones de campos, tablas y vistas de la base de datos del ERP-CRM.

**Respuesta:** Añadí los campos idioma y observaciones a los clientes, la tabla de facturas y cuatro vistas (detalle de reservas, historial de clientes, países y facturas).

**Evidencia:** `2.-Proyecto final de unidad/002-tablas y vistas/data/001-schema.sql` y `2.-Proyecto final de unidad/003-facturacion/data/001-schema.sql`

---

### RA 4 - Criterio c
**Pregunta / criterio:** c) Se han adaptado consultas.

**Respuesta:** La lista de reservas y su buscador pasan a usar una vista, y creé consultas de clientes que más gastan, países de procedencia y totales de facturación por mes, tipo de habitación y forma de pago.

**Evidencia:** `2.-Proyecto final de unidad/002-tablas y vistas/api/005-reservas.php`, `2.-Proyecto final de unidad/002-tablas y vistas/api/009-consultas.php` y `2.-Proyecto final de unidad/004-informes personalizados/api/011-informes.php`

---

### RA 4 - Criterio d
**Pregunta / criterio:** d) Se han adaptado interfaces de entrada de datos y de procesos.

**Respuesta:** El formulario de clientes incluye los campos nuevos, hay pantallas de reservas, tablero de recepción y facturas, y al hacer el check-out la aplicación avisa de la factura creada.

**Evidencia:** `2.-Proyecto final de unidad/002-tablas y vistas/api/003-entidades.php`, `2.-Proyecto final de unidad/003-facturacion/js/012-facturacion.js` y `2.-Proyecto final de unidad/005-procedimientos de servidor/js/005-reservas.js`

---

### RA 4 - Criterio e
**Pregunta / criterio:** e) Se han personalizado informes.

**Respuesta:** Hice tres informes para imprimir o guardar en PDF: el parte diario de recepción, la facturación mensual y la factura de una estancia. Además se exportan las tablas en CSV y JSON.

**Evidencia:** `2.-Proyecto final de unidad/004-informes personalizados/js/013-informes.js` y `2.-Proyecto final de unidad/004-informes personalizados/api/011-informes.php`

---

### RA 4 - Criterio f
**Pregunta / criterio:** f) Se han creado paneles de control.

**Respuesta:** El dashboard muestra ocupación, ADR, RevPAR, ingresos, canales y cancelaciones, y añadí facturación mensual, IVA, formas de pago y países.

**Evidencia:** `2.-Proyecto final de unidad/006-paneles de control/js/008-dashboard.js` y `2.-Proyecto final de unidad/006-paneles de control/api/008-kpis.php`

---

### RA 4 - Criterio g
**Pregunta / criterio:** g) Se han adaptado procedimientos almacenados de servidor.

**Respuesta:** Mi base de datos es SQLite, que no tiene procedimientos almacenados. La lógica que se ejecuta dentro de la base de datos la escribí con triggers: crear la factura al hacer el check-out, impedir que una factura se modifique o se borre, auditar los cambios de precio y evitar reservas solapadas.

**Evidencia:** `2.-Proyecto final de unidad/005-procedimientos de servidor/data/001-schema.sql`

---

### RA 4 - Criterio h
**Pregunta / criterio:** h) Se han realizado pruebas.

**Respuesta:** Ejecuté dos baterías de pruebas automáticas: 109 comprobaciones de la base (roles, reservas, concurrencia y seguridad) y 46 de las adaptaciones, todas correctas.

**Evidencia:** `2.-Proyecto final de unidad/008-pruebas y documentacion/pruebas/003-salida pruebas base.txt` y `2.-Proyecto final de unidad/008-pruebas y documentacion/pruebas/004-salida pruebas adaptaciones.txt`

---

### RA 4 - Criterio i
**Pregunta / criterio:** i) Se han documentado las operaciones realizadas y las incidencias observadas.

**Respuesta:** Documenté las operaciones paso a paso, la puesta en marcha, las incidencias que aparecieron con su solución y las limitaciones.

**Evidencia:** `2.-Proyecto final de unidad/008-pruebas y documentacion/documentacion/001-documentacion.md`

---

### RA 4 - Criterio j
**Pregunta / criterio:** j) Se han realizado integraciones con otro sistema de gestión empresarial.

**Respuesta:** Thistle envía sus clientes y facturas al ERP darkorange por su API. En darkorange crea el cliente, el producto, el pedido y la factura, y solo manda nombre, apellidos y email.

**Evidencia:** `2.-Proyecto final de unidad/007-integracion con otro sistema/api/012-integracion.php` y `1.-Ejercicios/002-Selección de los módulos del sistema ERP-CRM/jocarsa-universo-darkorange-CODIGO-COMPLETO/`
