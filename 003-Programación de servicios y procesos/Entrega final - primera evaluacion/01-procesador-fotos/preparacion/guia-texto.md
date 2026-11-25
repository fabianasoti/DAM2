# Guía del texto: Procesador de fotos

Objetivo: de 4 a 6 párrafos, estilo post. Redáctalo tú. Cuando me pases tu borrador te diré qué le falta sin reescribirlo.

## Párrafo 1: Introducción (competencias 6 y 7)
**Debe contener:** una necesidad humana (la página que se congela al procesar muchas fotos), quién la sufre y qué dificultad.
**Datos reales:** hipótesis de catálogos o álbumes; confírmala.
**EJEMPLO PARA ADAPTAR:** "Quien prepara un catálogo sabe lo que es aplicar el mismo filtro a decenas de fotos..."

## Párrafos 2 y 3: Para qué sirve (competencia 6)
**Debe contener:** qué hace una persona con ella, el beneficio y una medida verificable; límites.
**Datos reales:** filtros, barra de progreso, reloj que no se para, descarga; tiempos (tu medición en la web y la mía en C++).
**EJEMPLO PARA ADAPTAR:** "Se elige un lote, un filtro y se aplica a todas a la vez..."

## Párrafos 4 y 5: Cuestiones técnicas (competencias 1, 3, 5; 2 si procede)
**Debe contener:** dos decisiones con alternativa y coste; qué verificaste; dónde se ejecuta.
**Datos reales:** workers con cola dinámica; `Promise.all`; C++ con OpenMP como contraste; límite de repeticiones y avisos de error; 4 núcleos físicos; servidor web local. Competencia 2: cuenta con sinceridad cómo usaste el asistente y qué comprobaste tú.
**EJEMPLO PARA ADAPTAR:** "El trabajo se reparte entre workers. Las fotos esperan en una cola..."
**No hay evidencia** de la competencia 4 (datos): no la menciones.

## Párrafo 6: Cierre (competencias 6 y 7)
**Debe contener:** volver al problema, qué está resuelto, límites y mejora, agradecimiento.
**Datos reales:** no escala 8 veces; mejora: franjas y memoria compartida.
**EJEMPLO PARA ADAPTAR:** "No es ocho veces más rápido porque mi equipo tiene cuatro núcleos..."

Ejemplo completo de 5 párrafos en `apuntes-tecnicos.md`, sección 12.
