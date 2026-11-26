# Guía del texto: Hormiguero

Objetivo: de 4 a 6 párrafos, estilo post. Redáctalo tú. Cuando me pases tu borrador te diré qué le falta sin reescribirlo.

## Párrafo 1: Introducción (1 párrafo; competencias 6 y 7)
**Debe contener:** una necesidad humana, no la tecnología; quién tiene el problema; qué dificultad; qué te llevó a hacerlo. Sin prometer lo que no puedes demostrar.
**Datos reales:** una web se congela porque el navegador usa un hilo; lo sufre quien trabaja con fotos, mapas o datos (hipótesis, confírmala).
**EJEMPLO PARA ADAPTAR:** "Todos hemos visto una web que se queda congelada mientras piensa..."

## Párrafos 2 y 3: Para qué sirve (1-2 párrafos; competencia 6)
**Debe contener:** a quién ayuda, qué mejora concreta, un ejemplo de uso y una medida verificable; la utilidad, no la lista de funciones; límites.
**Datos reales:** sliders de hormigas, carga y workers; 55,5 ms frente a 22,7 ms (1000 hormigas, carga 5000, 8 workers); con carga 0 empeora (0,06 frente a 0,36 ms); en tu navegador, de 7,1 a 17,7 FPS con 8 workers.
**EJEMPLO PARA ADAPTAR:** "Con él se ve cuándo compensa repartir el trabajo y cuándo no..."

## Párrafos 4 y 5: Cuestiones técnicas (1-2 párrafos; competencias 1, 3, 5 y, si quieres, 2)
**Debe contener:** dos decisiones explicadas con alternativa, ventaja y coste (mejor dos bien que diez nombres); qué verificaste y qué riesgo queda; dónde se ejecuta.
**Datos reales:** workers frente a hilo principal; mismo código en ambos; copia de datos por mensajes; `pendientes` para esperar; `limitar()` valida controles; pruebas hechas y qué no se midió; corre en navegador con servidor web. Competencia 2: di con sinceridad cómo usaste el asistente y qué verificaste tú.
**EJEMPLO PARA ADAPTAR:** "El navegador tiene un solo hilo; los workers son hilos aparte y se hablan por mensajes..."
**No hay evidencia** de la competencia 4 (datos): no la menciones.

## Párrafo 6: Cierre (1 párrafo; competencias 6 y 7)
**Debe contener:** volver al problema, qué está resuelto, qué limitación reconoces, qué mejorarías, agradecimiento. Sin lista de tecnologías.
**Datos reales:** 4 núcleos, no 8 veces más; mejora: memoria compartida; FPS medidos solo en tu equipo.
**EJEMPLO PARA ADAPTAR:** "Al final, una herramienta sencilla para entender cuándo repartir el trabajo. Me falta..."

Ejemplo completo de 5 párrafos en `apuntes-tecnicos.md`, sección 12.
