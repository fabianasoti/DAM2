# Guía del texto: Chat con IA local

Objetivo: de 4 a 6 párrafos, estilo post. Redáctalo tú. Cuando me pases tu borrador te diré qué le falta sin reescribirlo.

## Párrafo 1: Introducción (competencias 6 y 7)
**Debe contener:** una necesidad humana: querer usar IA sin enviar información interna fuera; quién la tiene.
**Datos reales:** hipótesis del aula u oficina; confírmala.
**EJEMPLO PARA ADAPTAR:** "Muchas personas usan asistentes de IA, pero no siempre pueden escribir en ellos lo que quieren..."

## Párrafos 2 y 3: Para qué sirve (competencia 6)
**Debe contener:** qué hace una persona con él, qué gana, un ejemplo y una medida verificable; límites.
**Datos reales:** chat web con clave, aviso de cuántas IAs hay, respuesta con nombre de IA y tiempo; 4 s frente a ~8 s con 2 IAs (simuladas); respuestas reales de 2 a 9,5 s con Ollama.
**EJEMPLO PARA ADAPTAR:** "Se entra con una clave, se escribe y la respuesta llega indicando qué IA contestó..."

## Párrafos 4 y 5: Cuestiones técnicas (competencias 1, 2, 3, 5)
**Debe contener:** dos decisiones con alternativa y coste; seguridad y pruebas con evidencias; cómo se ejecuta y de qué depende.
**Datos reales:** WebSocket; IAs como programas aparte; claves por rol con `hmac`; límites de tamaño y ritmo; 15 pruebas; caída de una IA; sin cifrado. Competencia 2: explica con sinceridad cómo usaste un asistente al desarrollarlo y qué comprobaste tú; y que la aplicación reparte tareas entre IAs.
**EJEMPLO PARA ADAPTAR:** "Por dentro, un servidor mantiene las conexiones abiertas y reparte cada pregunta..."
**No hay evidencia** de la competencia 4 (datos): no la menciones.

## Párrafo 6: Cierre (competencias 6 y 7)
**Debe contener:** volver al problema, qué funciona, limitaciones y mejora, agradecimiento.
**Datos reales:** sin cifrado ni historial; mejora: `wss` y cuentas.
**EJEMPLO PARA ADAPTAR:** "Reconozco límites: la conexión no va cifrada..."

Ejemplo completo de 5 párrafos en `apuntes-tecnicos.md`, sección 12.
