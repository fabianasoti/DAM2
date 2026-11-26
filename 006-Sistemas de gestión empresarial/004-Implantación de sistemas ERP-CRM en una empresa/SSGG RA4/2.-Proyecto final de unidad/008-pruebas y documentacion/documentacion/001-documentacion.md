# Thistle PMS - Adaptación del ERP para un hotel

Supuesto: **Hotel Cardo Marino**, un hotel ficticio en Valencia con 50 habitaciones que necesita
gestionar reservas, recepción, limpieza, mantenimiento y facturación. Todos los datos son inventados.

## 1. Posibilidades de adaptación identificadas

| Qué se puede adaptar | Dónde | Hecho en esta unidad |
|---|---|---|
| Nombre, color y datos del emisor de las facturas | `data/002-config.json` | Datos del emisor |
| Dirección del otro sistema de gestión | `data/002-config.json` | Sí |
| Campos de cada formulario y permisos por rol | `api/003-entidades.php` | Idioma y observaciones en clientes |
| Tablas, vistas, índices y triggers | `data/001-schema.sql` | Facturas, 4 vistas y 4 triggers |
| Temporadas y precios | tabla `temporadas` | Fallas y Semana Santa |
| Menús y pantallas | `js/009-principal.js` | 4 pantallas nuevas |
| Informes y exportaciones | `api/011-informes.php`, `servicios/` | Informes imprimibles y facturas exportables |
| Paneles | `api/008-kpis.php`, `js/008-dashboard.js` | Facturación, formas de pago y países |

## 2. Operaciones realizadas

1. **Base**: se parte de Thistle PMS y se numeran sus archivos.
2. **Tablas y vistas**: campos nuevos en clientes, vistas `v_reservas_detalle`, `v_clientes_resumen`
   y `v_paises`, lista de reservas adaptada a la vista y pantalla "Clientes y países". Temporadas
   de Fallas y Semana Santa (la fecha de Pascua se calcula cada año).
3. **Facturación**: tabla `facturas`, vista `v_facturas`, facturas del histórico con numeración
   correlativa por año e IVA del 10 % incluido en el precio, pantalla de facturas.
4. **Informes**: parte diario de recepción, facturación mensual y factura, para imprimir o guardar en PDF.
5. **Procedimientos de servidor**: SQLite no tiene procedimientos almacenados, así que la lógica de la
   base de datos se escribe con triggers: factura automática al hacer el check-out, factura que no se
   puede modificar ni borrar y auditoría de los cambios de precio. Además, `data/004-procedimientos mysql.sql`
   adapta la facturación a MySQL con tres procedimientos almacenados: `hacer_checkout`,
   `resumen_facturacion` y `habitaciones_libres`.
6. **Paneles**: facturación mensual, IVA, formas de pago y países con más ingresos.
7. **Integración**: envío de clientes y facturas al ERP darkorange por su API
   (cliente, producto, pedido y factura). Solo viajan nombre, apellidos y email.
8. **Pruebas y documentación**.

## 3. Puesta en marcha

Desde la carpeta del proyecto (necesita PHP con SQLite):

```
php -S localhost:8000
```

Abrir `http://localhost:8000/001-login.html`. La base de datos se crea sola en la primera entrada,
con datos de ejemplo. Los usuarios de ejemplo y su contraseña están en `servicios/001-instalar.php`.

Para la integración hay que arrancar darkorange en el puerto 8001. Conviene usar una copia, porque
guarda datos. La carpeta está en `1.-Ejercicios/002-Selección de los módulos del sistema ERP-CRM/`:

```
cp -r jocarsa-universo-darkorange-CODIGO-COMPLETO ~/darkorange-demo
cd ~/darkorange-demo
php -S 127.0.0.1:8001
```

Después: Administración > Integración > "Enviar siguientes facturas".

Los procedimientos almacenados se prueban aparte en MySQL (el script crea su propia base `thistle_mysql`):

```
mysql -u root -p < "data/004-procedimientos mysql.sql"
```

## 4. Pruebas

| Prueba | Archivo | Resultado |
|---|---|---|
| Base: acceso, roles, reservas, concurrencia, seguridad y exportación | `pruebas/001-pruebas base.py` | 109 de 109 (`003-salida pruebas base.txt`) |
| Adaptaciones: vistas, facturas, informes, triggers, paneles e integración | `pruebas/002-pruebas adaptaciones.py` | 46 de 46 (`004-salida pruebas adaptaciones.txt`) |

La integración se prueba contra una copia real de darkorange. El script de MySQL se ejecutó en
MySQL 8.0: emite las facturas con numeración correlativa, rechaza un check-out no permitido y unas
fechas al revés, y se puede volver a ejecutar sin errores.

## 5. Incidencias observadas

| Incidencia | Solución |
|---|---|
| Al añadir el campo "idioma" como obligatorio dejaron de funcionar las altas de clientes que no lo enviaban (lo detectaron las pruebas base) | Valor por defecto "Español" al crear |
| darkorange rechazaba las facturas (`FOREIGN KEY constraint failed`): exigen un pedido y un producto existentes | Crear en orden cliente, producto, pedido y factura |
| Con nombres de archivo con espacios, la prueba pedía una dirección sin codificar | Codificar los espacios como `%20` (el navegador ya lo hace) |
| Al añadir Fallas y Semana Santa cambiaron los datos de ejemplo y la cifra esperada de temporadas | Actualizar la prueba (27 temporadas) |
| (En la versión base) El instalador generaba 0 reservas por el texto `+-365 day` | Calcular las fechas con `DateTime::modify` |
| (En la versión base) Se creaba una cookie de sesión para visitas sin iniciar sesión | No crear sesiones anónimas |

## 6. Limitaciones

- Datos ficticios; las facturas llevan un aviso de que no son reales.
- Facturación simplificada: sin facturas rectificativas ni envío a la Agencia Tributaria.
- La integración va en un solo sentido, de 25 en 25. Si se pulsa a la vez desde dos sesiones podría duplicar envíos.
- Si se reinicia la base de datos de darkorange, los identificadores guardados dejan de ser válidos.
- Los procedimientos de MySQL son una demostración aparte: la aplicación sigue usando SQLite.
- SQLite admite un solo escritor a la vez; sin HTTPS ni recuperación de contraseña.
