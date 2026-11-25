# Guion de vídeo: Chat con IA local (objetivo 2 min 30 s)

## Preparativos
- Instala `websockets` (te doy el comando cuando lo revisemos) e inicia Ollama con el modelo `gemma3:4b`.
- Terminal 1: `python3 servidor.py` (en `proyecto/`). Terminal 2: `python3 ia.py`. Si tienes un segundo equipo, otra IA con `python3 ia.py --servidor ws://IP:8765 --nombre ia-2`.
- Navegador con la URL del chat, dos ventanas (dos usuarios). Clave del aula: la de `configuracion.json`.
- Ensaya las preguntas antes: la respuesta de Ollama puede tardar varios segundos.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Página de entrada | Problema: usar una IA sin enviar las preguntas fuera de la red. |
| 0:20-0:50 | Entrar con una clave mala y luego la buena | Cada conexión necesita la clave de su rol. Aviso "1 IA conectada". |
| 0:50-1:30 | Hacer una pregunta; burbuja "Pensando..." y respuesta con IA y segundos | La respuesta viene de Ollama en este ordenador. Indica qué IA y cuánto tardó. |
| 1:30-2:00 | Segunda ventana de usuario o segunda IA; terminal del servidor | El servidor reparte a la IA con menos pendientes. Con 2 IAs, 8 preguntas en 4 s en vez de ~8 (con IA simulada). |
| 2:00-2:30 | Parar la IA con Ctrl+C y preguntar; mostrar `salida-pruebas.txt` | Si no hay IA, aviso claro; 15 pruebas. Límite: sin cifrado ni historial; mejora: `wss` y cuentas. |

## Plan B
- Ollama no arranca: usa `python3 ia.py --simulada` y **dilo en el vídeo** ("modo simulado"); las respuestas llevan la etiqueta.
- No conecta: comprueba que `servidor.py` sigue activo y el puerto 8765.
- La respuesta tarda demasiado: usa una pregunta corta o la IA simulada.
- Muestra `pruebas/salida-pruebas.txt` como evidencia.
