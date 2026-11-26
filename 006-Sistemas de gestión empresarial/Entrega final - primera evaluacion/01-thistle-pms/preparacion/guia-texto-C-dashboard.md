# Guía del texto C: Dashboard y extracción de datos

Objetivo: de 4 a 6 párrafos, estilo post, **un post por aspecto**. Redáctalo tú. Cuando me pases tu borrador te diré qué le falta, sin reescribirlo. El ejemplo completo de 5 párrafos está en `apuntes-C-dashboard.md`, sección 12.

## Párrafo 1: Introducción (competencias 6 y 7)
**Debe contener:** una necesidad humana (no la tecnología), quién la tiene y qué dificultad. No digas que has hablado con usuarios si no lo has hecho: razona quién lo sufre y por qué.
**Datos reales:** la dirección de un hotel quiere saber cómo va el negocio sin hojas de cálculo (hipótesis).
**EJEMPLO PARA ADAPTAR:** "Quien dirige un hotel necesita responder preguntas muy concretas: cuánta gente ocupó las habitaciones el mes pasado..."

## Párrafos 2 y 3: Para qué sirve (competencia 6)
**Debe contener:** a quién ayuda, qué mejora concreta, un ejemplo de uso y, si puedes, una medida verificable; función frente a beneficio; límites.
**Datos reales:** ocupación, ADR y RevPAR de 12 meses; ingresos por canal; próximos 14 días; exportación a CSV/JSON y copia programada con registro y retención de 30 días.
**EJEMPLO PARA ADAPTAR:** "Muestra la ocupación, el precio medio por noche y los ingresos por habitación disponible de los últimos doce meses..."

## Párrafo 4: Cuestiones técnicas (competencias 3, 4 y 5)
**Debe contener:** dos decisiones con su alternativa, ventaja y coste (mejor dos bien explicadas que diez nombres); qué verificaste y qué riesgo queda; dónde se ejecuta y qué necesita.
**Datos reales:** SQL con CTE recursivas; gráficas SVG propias; 12 meses contrastados con un cálculo independiente; RevPAR = ocupación × ADR (57 % × 89,1 € = 50,79 €); 56 ms con 4948 reservas; exportación sin contraseñas y con protección de fórmulas; cron para la exportación.
**EJEMPLO PARA ADAPTAR:** "Todo se calcula con consultas SQL sobre las reservas reales: una consulta recursiva genera los meses..."
**Sobre la competencia 2 (IA):** la aplicación no usa IA. Si quieres hablar de ella, que sea de cómo usaste un asistente al desarrollarla y qué comprobaste tú.

## Párrafo 5: Cierre (competencias 6 y 7)
**Debe contener:** volver al problema, qué está resuelto, qué limitación reconoces, qué mejorarías y un agradecimiento. Sin lista de tecnologías.
**Datos reales:** los ingresos se reparten por igual entre noches; no hay comparación interanual; mejora: tabla resumen y comparación con el año anterior.
**EJEMPLO PARA ADAPTAR:** "Los ingresos se reparten por igual entre las noches de una estancia y aún no se puede comparar con el año anterior..."
