# Ficha: Thistle PMS (ERP hotelero, común a los 4 aspectos)

## Problema y para quién (hipótesis, tú confirmas)
- Problema: un hotel pequeño gestiona reservas, habitaciones y averías con hojas de cálculo y avisos sueltos; hay riesgo de reservar dos veces una habitación, de meter a un huésped en una habitación sucia y de que nadie sepa cómo va el negocio.
- Quién lo sufre (hipótesis): recepción, limpieza, mantenimiento y dirección de un hotel de unas 50 habitaciones.
- Contexto: es tu ERP de clase llevado a un caso real y el paso previo a tu TFG (RoomOps). No invento qué hará RoomOps; dime cómo conectarlo.
- **Confirma tú:** este escenario, y que el hotel ficticio se llame "Hotel Cardo Marino" (se cambia en `data/config.json`).
- No he hablado con usuarios reales: en el texto no digas que lo has hecho.

## Decisiones técnicas y alternativas descartadas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Cliente-servidor con JSON (HTML/JS + PHP) | PHP que genera el HTML | Separación estricta, como en clase; se prueba la API sola. |
| SQLite | MySQL | Sin servidor y recomendado por el profe para prototipar; MySQL queda como siguiente paso. |
| Disponibilidad validada en PHP **y** con disparador en la base | Solo PHP | El disparador protege aunque se escriba directamente en la base. |
| Transacción `BEGIN IMMEDIATE` al reservar | Sin bloqueo | Evita que dos recepcionistas reserven a la vez (probado con 12). |
| Permisos por rol en el servidor | Solo ocultar botones | Ocultar no protege. |
| Datos mínimos por rol | Mandar todo y ocultar en el navegador | Si no se envía, no se puede ver. |
| Gráficas, calendario y plano propios | Librerías | Control, ligereza y colores del manual. |
| Datos de ejemplo calculados respecto a hoy | Un SQL fijo | Siempre hay llegadas y salidas. |
| `.htaccess` en `data/` | Nada | Impide descargar la base de datos en Apache. |

## Mediciones (reales)
`preparacion/mediciones/rendimiento.txt` (`python3 rendimiento.py`). Equipo i7-1185G7, PHP 8.3.6, SQLite 3.45.1, servidor integrado de PHP, 4948 reservas. Mediana de 30 repeticiones:
| Petición | Mediana |
|---|---|
| Disponibles (50 habitaciones con precio) | 1,2 ms |
| Lista de reservas (300 filas) | 1,2 ms |
| Tablero (habitaciones, llegadas, salidas, calendario) | 2,6 ms |
| Dashboard (12 meses, canales, tipos, próximos 14 días) | 56,2 ms |
| Lista de clientes (400 filas) | 1,3 ms |
Primer acceso (crea la base con datos): 376 ms. Comprobación de solape: **0,48 ms con índice y 35,1 ms sin él** (50 comprobaciones). Son medidas locales, sin red.

## Pruebas ejecutadas
- `pruebas/pruebas.py` → `salida-api.txt`: **109 comprobaciones correctas** con PHP y SQLite reales (acceso y roles, validaciones, concurrencia, disparador, flujo de recepción, mantenimiento, dashboard contrastado con un cálculo independiente, CRUD, servicios de entrada y salida, exportación programada, instalación).
- `pruebas/pruebas_interfaz.js` → `salida-interfaz.txt`: **62 comprobaciones correctas** con un navegador simulado (jsdom) contra el servidor real: login, cada rol recorriendo todas sus vistas sin errores de JavaScript, flujo completo de reserva y cancelación desde la interfaz, tablero, filtros, dashboard, limpieza resolviendo un parte, texto con HTML sin ejecutarse. **No es un navegador real.**
- Comprobado con tu Apache real: `data/schema.sql` da 403 y, sin SQLite en PHP, la aplicación da un mensaje claro.
- **No probado:** el aspecto visual real, varios usuarios desde distintos equipos, HTTPS, MySQL.

## Fallos reales al construir y su corrección
1. El instalador generaba 0 reservas: `"+-365 day"` se interpreta como `+365`. Corregido con `DateTime::modify`.
2. Los datos de ejemplo no dejaban habitaciones libres para las averías: se reservan dos habitaciones sin estancias alrededor de hoy.
3. PHP creaba una cookie de sesión para cualquier visita (incluso sin iniciar sesión). Corregido: no se crean sesiones anónimas.
4. La interfaz fallaba si cambiaba la dirección (`#…`) antes de comprobar la sesión. Protegido.
5. Un mensaje de error de validación mezclaba errores propios y de SQLite: separado en validar y guardar.
6. (De mis pruebas, no del proyecto) un servidor de prueba con hijos sin cerrar hacía que se probara contra código antiguo; ahora se cierra todo el grupo de procesos y se comprueba el puerto. Sobrescribí por error una versión de la prueba de API y la rehíce.

## Limitaciones
SQLite admite un solo escritor a la vez; sin HTTPS, doble factor ni recuperación de contraseña; sin facturación, pagos ni tarifas por canal; no se pueden modificar fechas de una reserva; ingresos repartidos por igual entre noches; las fuentes de Google requieren internet; la contraseña de ejemplo es pública.

## Siguiente mejora
Modificar reservas, tarifas por canal y facturación; HTTPS y doble factor; tabla resumen para el dashboard; paso a MySQL; la conexión con tu TFG.

## Evidencia por competencia
| Competencia | Evidencia | ¿Hay? |
|---|---|---|
| 1 Arquitectura | Cliente-servidor, API por módulo, CRUD genérico, permisos en el servidor, alternativas | Sí (aspectos A, B, D) |
| 2 Orquestación de IA | La aplicación no usa IA; solo cómo la has desarrollado | **No** (salvo que cuentes tu proceso con el asistente) |
| 3 Seguridad y verificación | Contraseñas cifradas, bloqueo, roles, consultas preparadas, CSRF, 171 comprobaciones | Sí (aspecto D y todos) |
| 4 Ingeniería de datos | Modelo de 8 tablas, restricciones, disparadores, transacciones, SQL analítico, auditoría, exportación | Sí (aspectos A y C) |
| 5 Infraestructura | PHP + SQLite, instalador, exportación con cron, `.htaccess`, dependencia de `php-sqlite3` | Parcial (sin despliegue real ni HTTPS) |
| 6 Lógica de negocio | Disponibilidad, tarifas por temporada, check-in/out, ADR y RevPAR | Sí (hipótesis de usuario) |
| 7 Comunicación | Vídeos y textos (uno por aspecto) | Sí |
