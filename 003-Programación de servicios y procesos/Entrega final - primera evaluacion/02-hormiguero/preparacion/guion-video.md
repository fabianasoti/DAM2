# Guion de vídeo: Hormiguero (objetivo 2 min 30 s)

## Preparativos
- Apache en marcha y abrir: `http://localhost/Github/DAM2/DAM2/003-Programaci%C3%B3n%20de%20servicios%20y%20procesos/Entrega%20final%20-%20primera%20evaluacion/02-hormiguero/proyecto/`
- Pestaña a la vista y a pantalla completa; cerrar otras pestañas pesadas.
- Haz un ensayo antes: con 3000 hormigas y carga alta debes ver que los FPS caen. Si no cae, sube la carga.
- Deja los controles en 1000 hormigas, carga 1000, 0 workers.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Página completa con hormigas | Problema: una web se congela con cálculo pesado; lo explico con hormigas. |
| 0:20-0:50 | Subir carga con 0 workers; FPS bajan; mover un slider cuesta | Un solo hilo calcula y dibuja; por eso se frena. Esto le pasa a una web con fotos o mapas. |
| 0:50-1:20 | Poner 4 y 8 workers; FPS suben | Los workers reparten el cálculo; la página responde. Hablan por mensajes. |
| 1:20-1:50 | Poner carga 0 con workers | Con poco trabajo los workers no ayudan: copiar datos cuesta. Mi medición: 0,06 ms frente a 0,36 ms. |
| 1:50-2:15 | Botón "Medir" y la tabla | Medida automática de 0, 1, 2, 4 y 8 workers. Mi equipo tiene 4 núcleos, por eso no es 8 veces. |
| 2:15-2:30 | Abrir `trabajador.js` o `principal.js` (líneas 92-109) | Cada worker tiene su trozo y la página espera a todos. Cierre: sirve para ver cuándo compensa repartir. |

## Plan B
- Los workers no arrancan: abrir por `http://localhost`, no por archivo.
- Los FPS no cambian: subir hormigas y carga.
- El botón Medir falla o tarda: enseñar `mediciones/salida-node.txt`.
- Apunta el FPS que veas para la ficha y el texto.
