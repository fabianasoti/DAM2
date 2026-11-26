# Guía del texto A: Reservas y disponibilidad

Objetivo: de 4 a 6 párrafos, estilo post, **un post por aspecto**. Redáctalo tú. Cuando me pases tu borrador te diré qué le falta, sin reescribirlo. El ejemplo completo de 5 párrafos está en `apuntes-A-reservas.md`, sección 12.

## Párrafo 1: Introducción (competencias 6 y 7)
**Debe contener:** una necesidad humana (no la tecnología), quién la tiene y qué dificultad. No digas que has hablado con usuarios si no lo has hecho: razona quién lo sufre y por qué.
**Datos reales:** un hotel pequeño y el riesgo de reservar dos veces la misma habitación (hipótesis a confirmar).
**EJEMPLO PARA ADAPTAR:** "En un hotel pequeño, reservar dos veces la misma habitación se nota cuando ya hay un huésped en la puerta..."

## Párrafos 2 y 3: Para qué sirve (competencia 6)
**Debe contener:** a quién ayuda, qué mejora concreta, un ejemplo de uso y, si puedes, una medida verificable; función frente a beneficio; límites.
**Datos reales:** disponibilidad con precio por noche y temporada; check-in y check-out que cambian el estado de la habitación; 12 reservas simultáneas de la misma habitación: 1 aceptada y 11 rechazadas; comprobación de solape de 35 ms a 0,48 ms con índice (4948 reservas).
**EJEMPLO PARA ADAPTAR:** "Recepción elige las fechas y ve solo las habitaciones libres, con el precio de cada noche..."

## Párrafo 4: Cuestiones técnicas (competencias 1, 3 y 4)
**Debe contener:** dos decisiones con su alternativa, ventaja y coste (mejor dos bien explicadas que diez nombres); qué verificaste y qué riesgo queda; dónde se ejecuta y qué necesita.
**Datos reales:** transacción `BEGIN IMMEDIATE` + disparador en la base; `NOT EXISTS`; máquina de estados; importe calculado en el servidor; SQLite con un solo escritor; validación con mensajes claros; importe contrastado con un cálculo independiente.
**EJEMPLO PARA ADAPTAR:** "Lo importante está en el servidor. Antes de guardar, se comprueba que la habitación esté libre dentro de una transacción..."
**Sobre la competencia 2 (IA):** la aplicación no usa IA. Si quieres hablar de ella, que sea de cómo usaste un asistente al desarrollarla y qué comprobaste tú.

## Párrafo 5: Cierre (competencias 6 y 7)
**Debe contener:** volver al problema, qué está resuelto, qué limitación reconoces, qué mejorarías y un agradecimiento. Sin lista de tecnologías.
**Datos reales:** no se pueden modificar reservas, ni hay pagos ni tarifas por canal; paso previo a tu TFG.
**EJEMPLO PARA ADAPTAR:** "Todavía no se pueden modificar las reservas ni hay pagos. Es el primer paso de un sistema más grande..."
