# Plan: Programación de servicios y procesos (entrega final, primera evaluación)

Estructura: `NN-proyecto/proyecto/` (lo que va al generador) y `NN-proyecto/preparacion/` (apuntes, ficha, guion, guía de texto; nunca dentro de `proyecto/`).

## Proyectos elegidos (orden de construcción)
| # | Carpeta | Concepto | Estado |
|---|---|---|---|
| 02 | `02-hormiguero` | Workers, concurrencia, FPS | Construido; falta repasar el apunte contigo y medir FPS en navegador |
| 03 | `03-reparto-calculo` | Computación distribuida, exclusión mutua (`flock`) | Pendiente |
| 04 | `04-chat-ia-local` | Sockets, WebSocket, tokens, IA local | Pendiente (hace falta `websockets` y Ollama) |
| 01 | `01-procesador-fotos` | Workers y C++/OpenMP (de `Control UD1`) | Pendiente: solo `preparacion/` |

Opcional si queda tiempo: sistema de turnos con TCP multihilo.

## Orden para grabar (propuesto)
1. Hormiguero (el más visual), 2. Procesador de fotos, 3. Reparto de cálculo, 4. Chat con IA local.

## Lista de comprobación (la haces tú)
- [ ] Sesión de supervisión iniciada (condición imprescindible).
- [ ] Repasar con Claude el apunte técnico de cada proyecto.
- [ ] Medir y anotar en la ficha lo que está marcado como "pendiente".
- [ ] Por proyecto: lanzarlo contra documentacion.jocarsa.com y obtener el informe markdown.
- [ ] Subir el informe a formacion.jocarsa.com (simulacros; en el examen, exámenes).
- [ ] Grabar el vídeo de 1-3 min con el guion de `preparacion/`.
- [ ] Escribir tú el texto de 4 a 6 párrafos sin IA y subir vídeo y texto a red.jocarsa.com.
- [ ] Comprobar que `proyecto/` no tiene `Zone.Identifier`, binarios ni dependencias.
