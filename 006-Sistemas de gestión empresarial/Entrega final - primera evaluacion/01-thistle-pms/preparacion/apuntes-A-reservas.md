# Aspecto A: Reservas y disponibilidad

## 1. Resumen en 3 líneas
Recepción busca habitaciones libres para unas fechas y ve el precio de cada una (con la temporada de cada noche); elige cliente y reserva. El servidor impide en dos niveles que la misma habitación se reserve dos veces, y controla el recorrido confirmada → check-in → check-out. Al hacer check-in o check-out la habitación cambia de estado sola.

## 2. Mapa de archivos y recorrido
`js/reservas.js` (asistente de nueva reserva, lista y detalle) → `api/reservas.php` (validar, bloquear, guardar) → `data/schema.sql` (restricciones y disparadores) → `data/thistle.db`. Precio: `calcular_importe()` en `api/comun.php`. El navegador manda JSON; el servidor contesta con JSON o con `error`.

## 3. Fragmentos clave
**A1. `data/schema.sql` líneas 100-112:** disparador `reservas_sin_solape_insertar`. Antes de guardar, la base de datos busca otra reserva activa de la misma habitación que se pise; si la hay, aborta con un mensaje. Concepto: integridad en la propia base de datos (última defensa aunque falle PHP).

**A2. `api/reservas.php` líneas 27-44:** `error_en_fechas` (fechas reales, salida posterior, no en el pasado, máximo 30 noches) y `hay_solape`. Concepto: validación de entradas.

**A3. `api/reservas.php` líneas 123-160 (`crear`):** `empezar_transaccion` (`BEGIN IMMEDIATE`) bloquea la base de datos para escribir; dentro se comprueba habitación, capacidad, cliente y solape, se calcula el importe y se guarda; `COMMIT` o `ROLLBACK`. Concepto: transacción y control de concurrencia.

**A4. `api/comun.php` líneas 179-195 (`calcular_importe`):** recorre cada noche y suma `precio_noche × multiplicador` de la temporada que la cubre. Concepto: regla de negocio calculada en el servidor.

**A5. `api/reservas.php` líneas 163-222 (`estado`):** solo se permite confirmada→check-in, confirmada→cancelada y check-in→check-out; el check-in exige que la habitación esté disponible; el check-out la deja sucia y crea el parte de limpieza (y acorta la estancia si sale antes). Concepto: máquina de estados y consistencia entre tablas.

## 4. Conceptos de la unidad aplicados
Modelo de datos con restricciones (clave foránea, `CHECK`, disparadores); consultas SQL con subconsultas (`NOT EXISTS`); transacciones; reglas de negocio de un ERP (disponibilidad, tarifas, estados); validación en servidor. Todo visto en las unidades de ERP/CRM y de acceso a datos.

## 5. Decisiones técnicas
- **Doble validación (PHP y disparador):** PHP da un mensaje claro y el disparador es la red de seguridad. Coste: la regla está en dos sitios.
- **`BEGIN IMMEDIATE`** frente a transacción normal: reserva ya el derecho a escribir; cuesta que otras peticiones esperen unos milisegundos.
- **Importe guardado en la reserva** (no recalculado cada vez): el precio no cambia si luego se edita la temporada. Coste: copia del dato.
- **Salida = entrada no es solape:** un huésped sale y otro entra el mismo día.
- **Check-in bloqueado si la habitación no está lista:** evita meter un huésped en una habitación sucia u ocupada.

## 6. Ejecución y datos
Entrar como recepción (`sergio.molina@cardomarino.example`) → "Nueva reserva". Datos: unas 5000 reservas de ejemplo en 50 habitaciones. Validación: fechas, canal, huéspedes, cliente y habitación; errores en español, con código 400 (dato incorrecto), 404 (no existe) o 409 (conflicto).

## 7. Verificación (real)
- **Concurrencia:** 12 recepcionistas reservan a la vez la misma habitación: se acepta 1 y se rechazan 11 (0,04 s) y solo queda una fila.
- Salida anterior o igual a la entrada, entrada en el pasado, 30 de febrero, más de 30 noches, canal inventado, huéspedes de más, cliente o habitación inexistentes: todos rechazados.
- Solape total, parcial y envolvente rechazados; salida = entrada permitida.
- El importe coincide con un cálculo independiente hecho aparte en Python con las temporadas.
- El disparador impide un solape **sin pasar por PHP**, insertando directamente en SQLite.
- Check-in con habitación sucia, en mantenimiento u ocupada: rechazado con el motivo. Check-out: habitación sucia, parte de limpieza creado y estancia acortada con importe recalculado.
- Consulta de solape con 4948 reservas: **0,48 ms con índice y 35,1 ms sin él** (50 comprobaciones). `disponibles` responde en 1,2 ms.
- Fallo real encontrado al construirlo: el instalador generaba 0 reservas porque `"+-365 day"` se interpreta como `+365` (corregido con `DateTime::modify`).

## 8. Limitaciones y mejora
No hay overbooking controlado, depósitos ni tarifas por canal; un cambio de fechas de una reserva existente no está en la interfaz. SQLite serializa las escrituras. Mejora: modificar reservas y tarifas por canal.

## 9. Chuleta de defensa
1. **¿Cómo evitas dos reservas de la misma habitación?** Validación en PHP dentro de una transacción y, además, un disparador en la base de datos; probado con 12 peticiones simultáneas.
2. **¿Por qué dos niveles?** PHP da el mensaje; el disparador protege aunque alguien escriba directamente en la base de datos.
3. **¿Cómo se calcula el precio?** Noche a noche: precio de la habitación por el multiplicador de la temporada de esa noche.
4. **¿Qué pasa si la habitación no está lista al hacer check-in?** Se rechaza con el motivo (sucia, ocupada o en mantenimiento).
5. **¿Qué aporta el índice?** La comprobación de solape pasó de 35 ms a 0,48 ms con 4948 reservas.

## 10. Glosario
- **PMS:** sistema de gestión de un hotel.
- **Solape:** dos estancias que comparten alguna noche.
- **Transacción:** grupo de cambios que se guardan todos o ninguno.
- **Disparador (trigger):** regla que la base de datos ejecuta sola antes o después de un cambio.
- **Índice:** estructura que acelera una búsqueda.
- **Check-in / check-out:** entrada y salida del huésped.
- **Máquina de estados:** lista de estados y de los cambios permitidos entre ellos.
- **Concurrencia:** varias peticiones a la vez.

## 11. Piezas para el post
- **Intro:** un hotel pequeño que gestiona reservas a mano o en hojas de cálculo; el miedo a reservar dos veces la misma habitación (hipótesis).
- **Para qué sirve:** buscar disponibilidad con precio por noche y temporada; check-in y check-out que actualizan la habitación.
- **Técnica:** transacción + disparador; `NOT EXISTS`; máquina de estados; importe en el servidor.
- **Verificación:** 12 reservas simultáneas, 1 aceptada; el disparador funciona sin PHP; importe contrastado; 35 ms → 0,48 ms con índice.
- **Cierre:** falta modificar reservas, tarifas por canal y pagos; siguiente paso hacia tu TFG.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
En un hotel pequeño, reservar dos veces la misma habitación es un problema que se nota cuando ya hay un huésped en la puerta. Muchas veces se evita a base de revisar una hoja de cálculo y confiar en que nadie se equivoque.

Para este proyecto construí la parte de reservas de un sistema de gestión hotelera. Recepción elige las fechas y ve solo las habitaciones libres, con el precio de cada una teniendo en cuenta la temporada de cada noche. Después elige al cliente, confirma, y al hacer el check-in o el check-out la habitación cambia de estado sola.

Lo importante está en el servidor. Antes de guardar, se validan las fechas y se comprueba que la habitación esté libre, todo dentro de una transacción para que dos personas no reserven a la vez. Y, por si algo falla, la propia base de datos tiene un disparador que impide guardar dos reservas que se pisen. El precio se calcula noche a noche, multiplicando la tarifa por el factor de la temporada.

Lo probé con doce peticiones simultáneas a la misma habitación: se aceptó una y se rechazaron once. También comprobé que el disparador funciona aunque se escriba directamente en la base de datos, y que el importe coincide con un cálculo independiente. Con casi cinco mil reservas, un índice hizo que la comprobación pasara de 35 a menos de 1 milisegundo.

Todavía no se pueden modificar las reservas ni hay pagos, y la base de datos admite un solo escritor a la vez. Es el primer paso de un sistema más grande. [Cierra con tu agradecimiento.]
