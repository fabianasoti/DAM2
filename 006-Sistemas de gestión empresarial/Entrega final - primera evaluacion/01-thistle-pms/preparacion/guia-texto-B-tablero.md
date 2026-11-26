# Guía del texto B: Tablero de recepción

Objetivo: de 4 a 6 párrafos, estilo post, **un post por aspecto**. Redáctalo tú. Cuando me pases tu borrador te diré qué le falta, sin reescribirlo. El ejemplo completo de 5 párrafos está en `apuntes-B-tablero.md`, sección 12.

## Párrafo 1: Introducción (competencias 6 y 7)
**Debe contener:** una necesidad humana (no la tecnología), quién la tiene y qué dificultad. No digas que has hablado con usuarios si no lo has hecho: razona quién lo sufre y por qué.
**Datos reales:** recepción necesita ver el estado del hotel sin abrir varias pantallas (hipótesis).
**EJEMPLO PARA ADAPTAR:** "Cuando llegas a la recepción de un hotel, lo primero que necesitas saber es qué habitaciones están libres..."

## Párrafos 2 y 3: Para qué sirve (competencia 6)
**Debe contener:** a quién ayuda, qué mejora concreta, un ejemplo de uso y, si puedes, una medida verificable; función frente a beneficio; límites.
**Datos reales:** plano de 50 habitaciones por color de estado; llegadas y salidas de hoy con check-in/out; calendario de 14 días donde se reserva pulsando una celda; cada rol ve lo que necesita.
**EJEMPLO PARA ADAPTAR:** "Muestra las cincuenta habitaciones por plantas, cada una de un color según su estado..."

## Párrafo 4: Cuestiones técnicas (competencias 1, 3 y 7)
**Debe contener:** dos decisiones con su alternativa, ventaja y coste (mejor dos bien explicadas que diez nombres); qué verificaste y qué riesgo queda; dónde se ejecuta y qué necesita.
**Datos reales:** sin librerías; calendario con `colspan` (cada fila ocupa exactamente 14 columnas); una sola petición de 28 KB en 2,6 ms; datos filtrados por rol en el servidor; colores de tu manual de identidad; **no se ha visto aún en un navegador real**.
**EJEMPLO PARA ADAPTAR:** "Está hecho sin librerías. El calendario es una tabla en la que cada reserva es una sola celda..."
**Sobre la competencia 2 (IA):** la aplicación no usa IA. Si quieres hablar de ella, que sea de cómo usaste un asistente al desarrollarla y qué comprobaste tú.

## Párrafo 5: Cierre (competencias 6 y 7)
**Debe contener:** volver al problema, qué está resuelto, qué limitación reconoces, qué mejorarías y un agradecimiento. Sin lista de tecnologías.
**Datos reales:** no se arrastran reservas ni se cambia de semana; mejora: navegación por semanas.
**EJEMPLO PARA ADAPTAR:** "Todavía no se pueden arrastrar reservas ni cambiar de semana en el calendario..."
