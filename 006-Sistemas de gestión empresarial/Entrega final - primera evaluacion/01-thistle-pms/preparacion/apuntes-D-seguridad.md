# Aspecto D: Seguridad, roles y mantenimiento

## 1. Resumen en 3 líneas
Cada persona entra con su cuenta, y lo que puede ver o hacer depende de su rol (administración, recepción, mantenimiento o limpieza), decidido siempre en el servidor. Las contraseñas se guardan cifradas con `password_hash`, el acceso se bloquea tras 5 intentos fallidos y cada acción importante queda en una auditoría. Las averías y la limpieza están ligadas a la habitación: una avería grave la bloquea para reservas y un parte de limpieza resuelto la deja disponible.

## 2. Mapa de archivos y recorrido
`login.html` + `js/login.js` → `api/sesion.php` (login, comprobación de contraseña, sesión) → `api/comun.php` (`usuario_actual`, `exigir_rol`, consultas preparadas, auditoría) → cada API comprueba el rol antes de actuar. Partes: `js/mantenimiento.js` → `api/mantenimiento.php`. Permisos de entidades: `api/entidades.php`.

## 3. Fragmentos clave
**D1. `api/sesion.php` líneas 20-58 (login):** cuenta los intentos fallidos del email en 10 minutos (5 bloquean); busca al usuario; **si no existe, compara igualmente con un hash falso** para tardar lo mismo y no revelar qué emails existen; `password_verify`; si acierta, `session_regenerate_id(true)` y se guarda el usuario en la sesión. Concepto: autenticación segura.

**D2. `api/comun.php` líneas 25-33, 41-48 y 60-70:** solo se aceptan peticiones de cambio en JSON (protección CSRF); la cookie de sesión es `HttpOnly` y `SameSite=Strict`; `exigir_rol` corta con 401 (sin sesión) o 403 (sin permiso). Concepto: control de acceso.

**D3. `api/comun.php` líneas 100-133 (`consultar`, `ejecutar`, `preparar`):** todas las consultas usan parámetros, nunca se pega un valor dentro del SQL. Y `api/crud.php` solo acepta entidades de una lista (`entidades.php`). Concepto: prevención de inyección SQL.

**D4. `api/mantenimiento.php` líneas 19-40:** qué rol ve y qué rol trabaja cada tipo de parte, y `actualizar_habitacion`, que decide el estado de la habitación (mantenimiento si hay una avería alta o urgente, sucia si queda limpieza pendiente, disponible si no). Concepto: reglas de negocio con permisos.

**D5. `servicios/salida.php` líneas 20-52:** nunca se exporta `password_hash` y las celdas que empiezan por `=` se protegen. Concepto: protección de datos sensibles.

## 4. Conceptos de la unidad aplicados
Programación segura (validación, contraseñas cifradas, sesiones, control de acceso, límites de intentos); roles y permisos de un sistema de gestión; trazabilidad (auditoría); integridad de los datos (claves foráneas). `password_hash` y `password_verify` los vimos el año pasado y aquí son el aspecto destacado: la contraseña nunca se guarda ni se devuelve.

## 5. Decisiones técnicas
- **Permisos en el servidor**, no en el menú: ocultar un botón no protege nada. Coste: cada API repite la comprobación (se centraliza en `exigir_rol`).
- **Mismo mensaje para usuario inexistente y contraseña errónea**, y mismo tiempo: no se revela qué emails existen.
- **Bloqueo temporal por email** y no por dirección IP: protege la cuenta aunque el atacante cambie de IP. Coste: un atacante puede bloquear a un usuario concreto durante 10 minutos.
- **Sesión PHP con cookie `HttpOnly`/`SameSite`** frente a tokens en `localStorage`: JavaScript no puede robar la cookie.
- **Datos mínimos por rol** (limpieza no recibe nombres de huéspedes).
- **Auditoría** de logins, reservas, check-in/out, exportaciones y cambios.

## 6. Ejecución y datos
Usuarios de ejemplo (todos con `Thistle2026!`; cámbiala en un uso real): `lucia.ferrer@` admin, `sergio.molina@` y `irene.campos@` recepción, `pablo.navarro@` mantenimiento, `rosa.delgado@` y `nuria.vidal@` limpieza, todos `@cardomarino.example`. En Apache, `data/.htaccess` impide descargar la base de datos (comprobado: `data/schema.sql` da 403).

## 7. Verificación (real)
- **Acceso:** sin sesión, los 6 servicios responden 401. Contraseña errónea y usuario inexistente dan el mismo mensaje. Una petición que no es JSON da 415.
- **Cookie:** se envía con `HttpOnly` y `SameSite=Strict`. Las contraseñas están cifradas (`$2y$…`) y ninguna respuesta contiene el hash.
- **Bloqueo:** tras 5 intentos fallidos se bloquea (429) aunque la contraseña sea correcta, sin afectar a otros usuarios; la auditoría registra login, login fallido y bloqueo.
- **Roles:** limpieza no ve reservas ni averías ni puede exportar; mantenimiento no ve el dashboard; recepción no ve usuarios ni auditoría ni crea habitaciones; una entidad inexistente (`sqlite_master`) da 404.
- **Inyección:** un nombre `x'); DROP TABLE clientes;--` se guarda como texto sin efecto. Un nombre con `<img onerror=…>` se muestra como texto y no se ejecuta (interfaz simulada).
- **Reglas de mantenimiento:** una avería urgente bloquea la habitación y deja de ofrecerse como disponible; no se puede reservar; al resolverla vuelve a disponible. Una avería baja no bloquea. Mantenimiento no puede resolver limpieza ni limpieza averías; recepción no resuelve averías.
- **Integridad:** no se borra un cliente con reservas; el admin no puede borrarse ni quitarse el rol; un usuario desactivado no entra.
- **Fallo real encontrado:** PHP creaba una cookie de sesión incluso para visitas sin sesión iniciada; corregido para no crear sesiones anónimas. Otro: la interfaz fallaba si cambiaba la dirección (`#`) antes de comprobar la sesión; protegido.

## 8. Limitaciones y mejora
No hay HTTPS (hay que ponerlo en producción), ni doble factor, ni recuperación de contraseña, ni caducidad de sesión configurable; el bloqueo por email permite molestar a un usuario; la contraseña de ejemplo es pública. Mejora: HTTPS, doble factor y contraseñas con caducidad.

## 9. Chuleta de defensa
1. **¿Cómo guardas las contraseñas?** Con `password_hash` (bcrypt); se comprueban con `password_verify`; nunca se devuelven.
2. **¿Qué pasa tras 5 intentos fallidos?** Se bloquea el acceso del email durante 10 minutos, incluso con la contraseña correcta.
3. **¿Dónde compruebas los permisos?** En el servidor, en cada API, con `exigir_rol`; el menú solo es comodidad.
4. **¿Cómo evitas la inyección SQL?** Consultas preparadas y una lista de entidades permitidas.
5. **¿Qué ve el personal de limpieza?** El estado de las habitaciones y sus partes; sin nombres de huéspedes ni reservas.

## 10. Glosario
- **Rol:** conjunto de permisos de un tipo de usuario.
- **Hash:** huella irreversible de una contraseña.
- **Sesión:** identificación de un usuario entre peticiones.
- **CSRF:** ataque que hace actuar a un usuario sin querer desde otra web.
- **Inyección SQL:** colar código en una consulta.
- **Consulta preparada:** consulta con parámetros separados del SQL.
- **Auditoría:** registro de quién hizo qué.
- **Fuerza bruta:** probar muchas contraseñas.

## 11. Piezas para el post
- **Intro:** en un hotel trabajan recepción, limpieza y mantenimiento y no todos deben ver los datos de los huéspedes (hipótesis).
- **Para qué sirve:** cada rol ve lo que necesita; las averías bloquean la habitación; la limpieza la libera; queda registro.
- **Técnica:** `password_hash`; permisos en el servidor; bloqueo por intentos; consultas preparadas; cookie `HttpOnly`/`SameSite`.
- **Verificación:** 109 pruebas de API; 5 intentos → bloqueo; roles probados; inyección sin efecto; fallos reales corregidos.
- **Cierre:** falta HTTPS y doble factor.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
En un hotel trabaja mucha gente: recepción, limpieza, mantenimiento y dirección. No todos necesitan ver los datos de los huéspedes ni tocar las mismas cosas, y cuando algo falla conviene saber quién hizo qué.

En mi sistema de gestión hotelera cada persona entra con su cuenta y su rol decide lo que ve. Limpieza ve qué habitaciones hay que preparar, pero no los nombres de los huéspedes; mantenimiento ve las averías; recepción gestiona reservas. Una avería urgente bloquea la habitación para que no se reserve, y cuando se resuelve vuelve a estar disponible.

Lo importante es que los permisos se comprueban en el servidor, no solo en el menú. Las contraseñas se guardan cifradas, tras cinco intentos fallidos se bloquea el acceso, las consultas usan parámetros para evitar la inyección SQL y la cookie de sesión no puede leerse desde JavaScript. Cada acción importante queda en un registro de auditoría.

Lo probé con más de cien pruebas automáticas: sin sesión todo da error, cada rol solo accede a lo suyo, el bloqueo funciona incluso con la contraseña correcta y un nombre con código malicioso se guarda como simple texto. Al probarlo encontré y corregí fallos reales, como que se creaban sesiones para visitantes anónimos.

Faltan cosas antes de usarlo de verdad: cifrar la conexión con HTTPS, el doble factor y la recuperación de contraseña. Es un paso más hacia mi proyecto final. [Cierra con tu agradecimiento.]
