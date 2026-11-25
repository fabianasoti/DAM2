# Guion de vídeo: Procesador de fotos (objetivo 2 min 30 s)

## Preparativos
- Apache en marcha y la URL: `http://localhost/Github/DAM2/DAM2/003-Programaci%C3%B3n%20de%20servicios%20y%20procesos/Entrega%20final%20-%20primera%20evaluacion/01-procesador-fotos/proyecto/`
- Ten a mano la carpeta `fotos/` para elegir las 21. Repeticiones: pon un valor con el que se vea el progreso (por ejemplo, 200).
- Terminal (en `proyecto/`) con el C++ ya compilado fuera de `proyecto/` para enseñar `~/filtro sepia 100 fotos`.
- Pestaña a la vista y otras cerradas. Ensaya la tabla de "Medir" antes.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Página vacía | Problema: filtrar muchas fotos congela la página. |
| 0:20-0:50 | Elegir las 21 fotos; elegir sepia; "Aplicar" con 4 workers | La barra avanza y el reloj de prueba no se para. |
| 0:50-1:20 | Pasar el ratón sobre una foto y descargar una | Original frente a filtrada; descarga. |
| 1:20-1:50 | "Medir 1, 2, 4 y 8 workers" y la tabla | Cola dinámica; tiempos y eficiencia; mis cuatro núcleos físicos. |
| 1:50-2:15 | Terminal: `~/filtro sepia 100 fotos` | Misma tarea en C++ con OpenMP; 5768 frente a 2031 ms (una de mis ejecuciones). |
| 2:15-2:30 | Código de `trabajador.js` o `principal.js` (líneas 152-178) | Cada worker coge la siguiente foto; cierre: límite de núcleos y mejora (franjas). |

## Plan B
- Los workers no arrancan: abre desde `http://localhost` (la página lo avisa).
- La tabla sale muy pareja: sube las repeticiones.
- La compilación del C++ falla: enseña `mediciones/salida-cpp.txt`.
- Anota los tiempos que veas por si los quieres en el texto.
