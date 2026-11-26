# Guía del texto D: Seguridad, roles y mantenimiento

Objetivo: de 4 a 6 párrafos, estilo post, **un post por aspecto**. Redáctalo tú. Cuando me pases tu borrador te diré qué le falta, sin reescribirlo. El ejemplo completo de 5 párrafos está en `apuntes-D-seguridad.md`, sección 12.

## Párrafo 1: Introducción (competencias 6 y 7)
**Debe contener:** una necesidad humana (no la tecnología), quién la tiene y qué dificultad. No digas que has hablado con usuarios si no lo has hecho: razona quién lo sufre y por qué.
**Datos reales:** en un hotel trabajan recepción, limpieza, mantenimiento y dirección y no todos deben ver lo mismo (hipótesis).
**EJEMPLO PARA ADAPTAR:** "En un hotel trabaja mucha gente: recepción, limpieza, mantenimiento y dirección..."

## Párrafos 2 y 3: Para qué sirve (competencia 6)
**Debe contener:** a quién ayuda, qué mejora concreta, un ejemplo de uso y, si puedes, una medida verificable; función frente a beneficio; límites.
**Datos reales:** cada rol ve lo suyo (limpieza no ve nombres de huéspedes); una avería urgente bloquea la habitación y al resolverla vuelve a disponible; la limpieza libera habitaciones; auditoría de acciones.
**EJEMPLO PARA ADAPTAR:** "Cada persona entra con su cuenta y su rol decide lo que ve. Limpieza ve qué habitaciones hay que preparar..."

## Párrafo 4: Cuestiones técnicas (competencias 1, 3 y 4)
**Debe contener:** dos decisiones con su alternativa, ventaja y coste (mejor dos bien explicadas que diez nombres); qué verificaste y qué riesgo queda; dónde se ejecuta y qué necesita.
**Datos reales:** `password_hash` y `password_verify` (aspecto destacado); bloqueo tras 5 intentos; mismo mensaje y mismo tiempo para usuario inexistente; cookie `HttpOnly` y `SameSite=Strict`; consultas preparadas; permisos en el servidor; 109 pruebas de API; fallos reales corregidos (sesiones anónimas).
**EJEMPLO PARA ADAPTAR:** "Lo importante es que los permisos se comprueban en el servidor, no solo en el menú..."
**Sobre la competencia 2 (IA):** la aplicación no usa IA. Si quieres hablar de ella, que sea de cómo usaste un asistente al desarrollarla y qué comprobaste tú.

## Párrafo 5: Cierre (competencias 6 y 7)
**Debe contener:** volver al problema, qué está resuelto, qué limitación reconoces, qué mejorarías y un agradecimiento. Sin lista de tecnologías.
**Datos reales:** falta HTTPS, doble factor y recuperación de contraseña; la contraseña de ejemplo es pública.
**EJEMPLO PARA ADAPTAR:** "Faltan cosas antes de usarlo de verdad: cifrar la conexión con HTTPS, el doble factor..."
