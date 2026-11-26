# Plan: Programación de servicios y procesos (entrega final, primera evaluación)

Estructura: `NN-proyecto/proyecto/` (lo que va al generador) y `NN-proyecto/preparacion/` (apuntes, ficha, guion, guía de texto, mediciones y pruebas; nunca dentro de `proyecto/`).

## Estado de los proyectos
| # | Carpeta | Concepto | Peso | Construido y probado | Falta (tú) |
|---|---|---|---|---|---|
| 01 | `01-procesador-fotos` | Workers con cola, C++/OpenMP | 2,0 MB (21 fotos) | Código tuyo copiado; C++ medido por mí | Repaso del apunte; fallos reales que recuerdes; probar en navegador |
| 02 | `02-hormiguero` | Workers, concurrencia, FPS | 40 KB | Sí (cálculo medido en Node; página con navegador simulado) | Pulsar "Medir" en el navegador y anotar FPS; repaso |
| 03 | `03-reparto-calculo` | Computación distribuida, `flock` | 156 KB | Sí (16 esclavos, paquete perdido, entradas inválidas, velocidad) | Probar con varias ventanas; anotar tiempos; repaso |
| 04 | `04-chat-ia-local` | WebSocket, IAs, claves | 44 KB | Sí: 15 pruebas con IA simulada y Ollama falso, y **prueba con Ollama real** (`gemma3:4b`, respuestas de 2 a 9,5 s) | Verlo en un navegador; repaso. Ojo: tu `pasarela.py` usa el puerto 8765 como el chat (ver abajo) |
| 05 | `05-turnos-tcp` (opcional) | Sockets TCP, hilos, candado | 16 KB | Sí (21 comprobaciones, 300 clientes) | Decidir si lo incluyes; repaso |

## Orden para grabar (propuesto)
1. Hormiguero, 2. Procesador de fotos, 3. Reparto de cálculo, 4. Chat con IA local, 5. Turnos (si lo incluyes).

## Comandos que te tocan
Instalar la librería del chat (una vez, fuera del proyecto):
```
sudo apt install python3-websockets
```
Ollama (según `006-Traca final/001-Primera evaluacion/instalacion de modelo.md`):
```
ollama serve
ollama pull gemma3:4b
```
Si Ollama está en Windows y el proyecto en WSL, puede hacer falta cambiar `ollama` en `04-chat-ia-local/proyecto/configuracion.json` por la dirección de Windows.
Compilar el C++ del 01 (el binario se deja fuera de `proyecto/`):
```
g++ -O2 -fopenmp cpp/filtro.cpp -o ~/filtro $(pkg-config --cflags --libs opencv4)
```

## Decisiones abiertas (las tomamos juntas)
1. ¿Incluyes el 05 de turnos? Con 01-04 ya tienes 4; con el 05, 5.
2. 01: ¿dejamos las 21 fotos (1,9 MB, ilustraciones) o reducimos a unas pocas para que sea más ligero?
3. Hipótesis del problema y del usuario de cada proyecto: confirma o cambia las de cada `ficha.md`.
4. Competencia 2 (orquestación de IA): cómo vas a contar tu uso del asistente.
5. 04: Ollama ya está instalado en este Linux con `gemma3:4b`. Si el puerto 8765 está ocupado (por ejemplo, por `pasarela.py`), cambia `puerto` en `configuracion.json` y abre la página con `?puerto=NUEVO`.
6. Los números que aparecen en los ejemplos de post vienen de mis mediciones; los del navegador faltan hasta que midas.

## Pendiente de verificar por ti (no he podido: no hay navegador en este equipo)
- Aspecto y funcionamiento reales de 01, 02, 03 y 04 en un navegador.
- FPS del hormiguero y tabla "Medir" de 01 y 02.
- Varias ventanas o equipos reales en el 03; varios equipos en el 04 y el 05.
- Ollama real en el 04: ya probado por mí desde la línea de comandos (no en el navegador).

## Lista de comprobación (la haces tú)
- [ ] Sesión de supervisión iniciada (condición imprescindible).
- [ ] Repasar con Claude el apunte técnico de cada proyecto (una a una).
- [ ] Anotar en cada ficha lo marcado como "pendiente".
- [ ] Por proyecto: lanzarlo contra documentacion.jocarsa.com y obtener el informe markdown.
- [ ] Subir el informe a formacion.jocarsa.com (simulacros; en el examen, exámenes).
- [ ] Grabar el vídeo de 1-3 min con el guion de `preparacion/`.
- [ ] Escribir tú el texto de 4 a 6 párrafos sin IA y subir vídeo y texto a red.jocarsa.com.
- [ ] Comprobar que `proyecto/` no tiene `Zone.Identifier`, binarios ni dependencias (ahora está limpio).

## Otras fases pendientes
- **Fase B, Sistemas de gestión:** comparar `thistle` con `darkorange`, proponer ambientación, datos y 4 aspectos. Material nuevo copiado: `018-planteamiento del ejercicio de final de unidad.md`, clases PHP y `modelodedatos.txt`.
- **Fase C, Interfaces:** esperar tus RA.
- Nada está commiteado; el git solo ve archivos nuevos.
