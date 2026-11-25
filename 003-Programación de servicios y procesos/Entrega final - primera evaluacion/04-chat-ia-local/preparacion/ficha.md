# Ficha: Chat con IA local

## Problema y para quién (hipótesis, tú confirmas)
- Problema: quien necesita un asistente de IA pero no debe o no quiere enviar sus preguntas a un servicio externo.
- Quién lo sufre (hipótesis): un aula, una oficina pequeña o un taller con información interna.
- Aplicación real: asistentes internos que funcionan en la propia red.
- **Confirma tú:** este escenario u otro (por ejemplo, un asistente para dudas de clase).

## Decisiones técnicas y alternativas descartadas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| WebSocket | Peticiones HTTP repetidas | Conexión abierta; la respuesta llega cuando está lista. |
| IAs como programas aparte | IA dentro del servidor | Se pueden añadir más y repartir carga. |
| Elegir la IA con menos pendientes | Turno rotatorio | Evita que una IA lenta se acumule. |
| Sin guardar mensajes | Guardar en base de datos | Privacidad y sencillez. |
| Claves en `configuracion.json` | Cuentas de usuario | Simple; coste: texto plano y sin cifrar. |
| Ollama local | IA en la nube | Datos dentro de la red. |
| Modo `--simulada` | Nada | Probar sin Ollama; en pantalla se indica que es simulado. |

## Mediciones (reales)
Con IA simulada (cada respuesta tarda 1 s): 8 preguntas entre 2 IAs en 4,0 s (4 y 4). Con una IA sería ~8 s (estimado, 8 × 1 s). Archivo: `pruebas/salida-pruebas.txt`.
**Pendiente (lo mides tú):** segundos por respuesta con Ollama real y `gemma3:4b` (los muestra cada burbuja): ______.

## Pruebas ejecutadas
- `py_compile` de `servidor.py` e `ia.py` y `node --check` de `chat.js`.
- `probar_chat.py`: 15 pruebas con servidor e IAs reales (`salida-pruebas.txt` con websockets 17.4 y `salida-pruebas-websockets-10.4.txt` con 10.4): todas correctas.
- IA real contra un **Ollama falso** (servidor HTTP de prueba) y con Ollama apagado.
- `prueba_pagina.js`: página con navegador simulado contra el servidor real.
- **No probado:** Ollama real, navegador real, varios ordenadores, Ollama dentro de Windows frente a WSL.

## Fallos reales al construir y su corrección
Ninguno en el proyecto. En mi script de pruebas hubo dos errores míos, ya corregidos: terminaba también el proceso del servidor, y leía avisos de estado antiguos antes de que se conectara la segunda IA (el reparto parecía fallar y era la prueba).

## Limitaciones
Sin cifrado (`ws://`); clave compartida; sin historial ni cuentas; el reparto no pondera la potencia; respuestas completas, no palabra a palabra.

## Siguiente mejora
`wss` con certificado, cuentas de usuario y respuesta en flujo.

## Evidencia por competencia
| Competencia | Evidencia | ¿Hay? |
|---|---|---|
| 1 Arquitectura | Servidor, IAs y página separados; alternativas y costes | Sí |
| 2 Orquestación de IA | El servidor reparte tareas entre IAs locales y gestiona sus fallos; además, cómo usaste tú un asistente en el desarrollo | Sí (cuéntalo con sinceridad) |
| 3 Seguridad y verificación | Claves por rol, `hmac`, límites, validación, 15 pruebas; falta cifrado | Sí (con límite) |
| 4 Ingeniería de datos | No se guardan datos | **No** |
| 5 Infraestructura | Servidor, IAs, Ollama y Apache; no probado en red real | Parcial |
| 6 Lógica de negocio | Privacidad de las preguntas internas | Sí (hipótesis) |
| 7 Comunicación | Vídeo y texto | Sí |
