# Ficha: Hormiguero (workers)

## Problema y para quién (hipótesis, tú confirmas)
- Problema: una página web se congela cuando hace cálculos largos, porque el navegador solo tiene un hilo para calcular y dibujar.
- Quién lo sufre (hipótesis): quien usa editores de fotos online, mapas o paneles con muchos datos; y quien aprende programación y no ve por qué se cuelga.
- Aplicación real: cualquier web con cálculo pesado (procesar imágenes, simulaciones, análisis de datos grandes) que quiera seguir respondiendo.
- **Confirma tú:** si esta es la necesidad que quieres presentar, o la cambias.

## Decisiones técnicas y alternativas descartadas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Web Workers del navegador | Procesos del sistema / C++ | Es lo visto en clase y se ve en pantalla. |
| Mismo `hormigas.js` en principal y worker | Código duplicado | Comparación justa y un solo sitio donde cambiar. |
| Cada worker guarda su grupo y devuelve posiciones | Enviar todas las hormigas cada fotograma | Menos copias. |
| Esperar a todos con `pendientes` | Dibujar según lleguen | Más simple; el dibujo no se parte. |
| Dibujo en 2 trazos | Un dibujo por hormiga | El dibujo es del hilo principal; no debe ocultar la diferencia. |
| Datos al azar al arrancar | Guardar en archivo | No hace falta persistencia. |

## Mediciones (real)
Archivo: `mediciones/salida-node.txt`. Comando (desde `preparacion/mediciones/`):
```
node medir-node.js ../../proyecto/js/hormigas.js
```
Equipo: i7-1185G7, 4 núcleos y 8 hilos, Node v22.23.5. Tiempo de cálculo por fotograma (ms, media de 60 fotogramas tras 10 de calentamiento):

| Hormigas | Carga | 0 workers | 1 | 2 | 4 | 8 |
|---|---|---|---|---|---|---|
| 1000 | 0 | 0,06 | 0,16 | 0,16 | 0,26 | 0,36 |
| 1000 | 1000 | 9,69 | 9,10 | 5,52 | 4,39 | 4,05 |
| 1000 | 5000 | 55,48 | 48,03 | 29,36 | 26,04 | 22,70 |
| 3000 | 5000 | 161,54 | 174,88 | 116,33 | 79,67 | 66,96 |

Son medidas de cálculo, no de FPS. Entre ejecuciones hay variación (una ejecución anterior dio 48,51 ms en 1000/5000/0 workers).

**FPS en el navegador (medido por ti el 2026-11-26, botón "Medir"; 1000 hormigas, carga 5000):**

| Workers | 0 | 1 | 2 | 4 | 8 |
|---|---|---|---|---|---|
| FPS | 7,1 | 7,3 | 10,6 | 15,0 | 17,7 |
| ms de cálculo | 139,3 | 127,7 | 84,6 | 57,9 | 49,3 |

Con 8 workers hay 2,5 veces más FPS y el cálculo es 2,8 veces más rápido. En el navegador cada fotograma tarda más que en la medición con Node (139 frente a 55 ms sin workers), pero la proporción se parece.

## Pruebas ejecutadas
- `node --check` sobre `hormigas.js`, `trabajador.js` y `principal.js`: sin errores.
- `node prueba-humo.js ../../proyecto` (navegador simulado): funciona sin y con 4 workers; 99999 hormigas se limita a 3000; "abc" en carga vuelve a 1000.
- No probado en un navegador real ni el aspecto visual.

## Fallos reales al construir y su corrección
Ninguno detectado en las pruebas. Precaución de diseño (no fue un fallo observado): al cambiar controles se paran los workers antiguos y se pone `pendientes = 0` para que el bucle no se quede esperando a un worker que ya no existe.

## Limitaciones
- 8 workers no dan 8 veces más: hay 4 núcleos físicos y los mensajes cuestan.
- Dibujo siempre en el hilo principal.
- Si la pestaña no está a la vista, el navegador pausa la animación y la medición se falsea.
- Abrir sin servidor web puede impedir que arranquen los workers (no lo he comprobado).

## Siguiente mejora
Memoria compartida para evitar copias, o dibujar en un worker (conceptos no vistos en clase).

## Evidencia por competencia
| Competencia | Evidencia | ¿Hay? |
|---|---|---|
| 1 Arquitectura | Principal frente a workers, código compartido, alternativas y costes | Sí |
| 2 Orquestación de IA | Depende de cómo lo cuentes tú: se construyó con asistente y se verificó con mediciones y pruebas | A decidir por ti |
| 3 Seguridad y verificación | `limitar()`, pruebas de humo, mediciones | Parcial (sin permisos ni contraseñas) |
| 4 Ingeniería de datos | No hay datos persistentes | **No** |
| 5 Infraestructura | Se ejecuta en navegador con servidor web, sin dependencias | Parcial |
| 6 Lógica de negocio | Problema y uso real de los workers | Sí (hipótesis) |
| 7 Comunicación | Vídeo y texto | Sí |
