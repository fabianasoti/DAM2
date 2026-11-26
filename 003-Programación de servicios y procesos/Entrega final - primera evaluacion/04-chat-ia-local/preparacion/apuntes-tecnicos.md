# Apuntes técnicos: Chat con IA local

## 1. Resumen en 3 líneas
Un asistente de chat para un aula u oficina: los usuarios escriben en una página web y sus preguntas las contesta una IA que corre en un ordenador de la propia red (Ollama), sin enviar nada a internet. Un servidor WebSocket recibe las preguntas y las reparte entre las IAs conectadas. Cada conexión se identifica con una clave.

## 2. Mapa de archivos
| Archivo | Qué hace |
|---|---|
| `servidor.py` | Servidor WebSocket: identifica a quien se conecta, reparte preguntas a las IAs y devuelve respuestas. |
| `ia.py` | Una IA: se conecta al servidor, recibe preguntas y las contesta con Ollama (`--simulada` para probar sin Ollama). |
| `configuracion.json` | Puerto, claves (inventadas), dirección de Ollama y modelo. |
| `index.html`, `js/chat.js`, `css/estilo.css` | Página de chat. |

Orden: se arranca `servidor.py`; se arrancan una o más `ia.py`; el usuario abre la página y entra con nombre y clave. Viaje de una pregunta: página → servidor → IA → Ollama → IA → servidor → página.

## 3. Fragmentos clave
**A. `servidor.py` líneas 115-160 (`atender`): identificarse.** Lo primero que llega debe ser un mensaje "hola" con rol, nombre y clave en menos de 10 s; si la clave no es la de su rol, se cierra. Concepto: autenticación por rol.

**B. `servidor.py` líneas 70-95 (`tratar_pregunta`): validar y repartir.** Comprueba que hay texto, que no pasa de 500 caracteres, el límite de 10 preguntas por minuto y que hay IAs; luego elige la IA con menos preguntas pendientes (`min(ias, key=pendientes_de)`). Concepto: reparto de carga y validación.

**C. `servidor.py` líneas 46-50: comparar la clave.** `hmac.compare_digest` compara sin dar pistas por el tiempo de respuesta. Concepto: programación segura.

**D. `ia.py` líneas 27-60: preguntar a Ollama.** Una petición HTTP a `/api/chat`; se ejecuta con `asyncio.to_thread` para no bloquear la conexión mientras la IA piensa. Si Ollama no responde, se devuelve un error claro. Concepto: hilo auxiliar y gestión de errores.

**E. `servidor.py` líneas 165-180 (`finally`): limpieza.** Si una IA se cae, los usuarios que esperaban reciben un aviso. Concepto: robustez.

## 4. Conceptos de la unidad
Sockets y WebSocket; roles cliente y servidor; programación asíncrona (`async`/`await`); hilos auxiliares (`to_thread`); seguridad: claves, comparación segura, límites de tamaño y de ritmo; servicios en red. Todo visto en `003-Programación de comunicaciones en red`, `004` y `006-Traca final`; nada nuevo.

## 5. Decisiones técnicas
- **WebSocket** frente a peticiones HTTP repetidas: la conexión queda abierta y la respuesta llega cuando está lista.
- **IAs como programas aparte** que se conectan al servidor: se pueden añadir más sin tocar el servidor. Coste: más piezas que arrancar.
- **Elegir la IA con menos pendientes**: reparto simple; no tiene en cuenta la potencia de cada equipo.
- **Nada se guarda en disco:** privacidad; se pierde el historial.
- **Claves en `configuracion.json`:** simple; coste: están en texto y la conexión no va cifrada (`ws://`).
- **Ollama local** frente a una IA en la nube: los datos no salen de la red; coste: depende de tu equipo.

## 6. Ejecución y datos
Dependencia: la librería `websockets` de Python (la instalas tú). Ollama con el modelo `gemma3:4b` (el de clase).
```
cd proyecto
python3 servidor.py
python3 ia.py            (otra terminal; o: python3 ia.py --simulada)
```
Página: `http://localhost/Github/DAM2/DAM2/003-Programaci%C3%B3n%20de%20servicios%20y%20procesos/Entrega%20final%20-%20primera%20evaluacion/04-chat-ia-local/proyecto/` (la página se conecta al puerto 8765 del mismo ordenador).
Datos: solo mensajes en memoria. Validación: nombre de 1 a 20 caracteres, pregunta de 1 a 500, 10 por minuto, tamaño máximo de mensaje 16 KB, clave por rol. Errores: aviso en pantalla si no hay IA, si Ollama no responde o si la IA se cae.

## 7. Verificación (real, en `preparacion/pruebas/`)
15 pruebas con servidor e IAs reales, todas correctas, con `websockets` 17.4 y con 10.4:
- Claves incorrectas, nombre vacío, rol desconocido, mensaje sin presentación y conexión muda (se cierra a los 10,0 s).
- Sin IAs, aviso claro. Con una IA simulada, pregunta y respuesta.
- Pregunta de 501 caracteres y vacía rechazadas; la pregunta 11 en un minuto rechazada (10 contestadas).
- **Reparto:** 8 preguntas de 1 s entre 2 IAs: 4 y 4, en 4,0 s (con una IA, ~8 s: estimado).
- Si una IA se cae con una pregunta pendiente, el usuario recibe aviso.
- IA real hablando con un **Ollama falso**, y con Ollama apagado, error claro.
- Página (navegador simulado): entrar, clave mala, pregunta y respuesta.
- **Con Ollama real** (`gemma3:4b`, equipo sin GPU dedicada): respuestas en 9,5 s (la primera, que puede incluir la carga del modelo), 4,3 s y 2,0 s.
- **Sin probar:** navegador real y varios ordenadores.

## 8. Limitaciones y mejora
Sin cifrado (`wss`); claves compartidas; no hay historial ni cuentas; el reparto no pondera la potencia. Mejora: cifrado, usuarios con cuenta y respuesta que aparece palabra a palabra.

## 9. Chuleta de defensa
1. **¿Por qué WebSocket?** Mantiene la conexión abierta: el servidor puede avisar cuando la respuesta está lista.
2. **¿Cómo repartís entre varias IAs?** A la que menos preguntas tiene pendientes; con 2 IAs, 8 preguntas se hicieron en 4 s en vez de ~8.
3. **¿Qué pasa si Ollama o una IA se cae?** El usuario recibe un aviso claro; probado.
4. **¿Qué medidas de seguridad hay?** Clave por rol comparada con `hmac`, límites de tamaño y de ritmo, validación de entradas; limitación: sin cifrado.
5. **¿Por qué una IA local?** Los datos no salen de la red.

## 10. Glosario
- **WebSocket:** conexión abierta en los dos sentidos entre navegador y servidor.
- **Ollama:** programa que ejecuta modelos de IA en tu ordenador.
- **asyncio:** forma de atender muchas conexiones sin bloquearse.
- **to_thread:** ejecutar algo lento en otro hilo.
- **hmac.compare_digest:** comparar claves sin filtrar información.
- **Límite de ritmo:** máximo de peticiones por minuto.
- **Modelo:** la IA concreta (`gemma3:4b`).
- **Token/clave:** secreto compartido para entrar.

## 11. Piezas para el post
- **Intro:** quien no quiere enviar preguntas internas a una IA en la nube; asistente en la propia red.
- **Para qué sirve:** chat web, varias IAs, aviso de cuántas hay; las respuestas indican quién y en cuánto tiempo.
- **Técnica:** WebSocket; servidor que reparte; IAs como programas aparte; `to_thread`; clave por rol.
- **Verificación:** 15 pruebas; 4 s en vez de ~8 con 2 IAs; caída de una IA; Ollama apagado.
- **Cierre:** sin cifrado ni historial; mejora: `wss` y cuentas; respuestas reales de 2 a 9,5 s con `gemma3:4b`.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
Muchas personas usan asistentes de IA, pero no siempre pueden escribir en ellos lo que quieren: preguntas internas, datos de clientes, apuntes de clase. Enviar todo eso a un servicio externo no siempre es buena idea.

Para probar otra opción, hice un chat de aula en el que las preguntas las contesta una IA que funciona en un ordenador de la propia red. Se entra con un nombre y una clave, se escribe y la respuesta llega indicando qué IA contestó y cuánto tardó. Si hay varias IAs conectadas, la página muestra cuántas hay.

Por dentro, un servidor WebSocket mantiene las conexiones abiertas y reparte cada pregunta a la IA que menos trabajo tiene. Cada IA es un programa aparte que habla con Ollama, así que se pueden añadir más sin tocar el servidor. Las claves se comparan de forma segura, y hay límites de tamaño y de ritmo para que nadie sature el sistema.

Lo comprobé con quince pruebas: claves incorrectas, preguntas vacías o demasiado largas, y el caso en que una IA se cae con una pregunta pendiente, donde el usuario recibe un aviso. Con dos IAs, ocho preguntas de un segundo se contestaron en cuatro segundos en lugar de unos ocho. Con el modelo real de Ollama, las respuestas tardaron entre dos y diez segundos.

Reconozco límites: la conexión no va cifrada y no hay historial ni cuentas, solo una clave compartida. Lo siguiente sería cifrar la conexión y dar cuenta a cada usuario. [Cierra con tu agradecimiento.]
