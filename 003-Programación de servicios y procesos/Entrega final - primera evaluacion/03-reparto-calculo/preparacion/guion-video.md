# Guion de vídeo: Reparto de cálculo (objetivo 2 min 30 s)

## Preparativos
- Apache en marcha. URL: `http://localhost/Github/DAM2/DAM2/003-Programaci%C3%B3n%20de%20servicios%20y%20procesos/Entrega%20final%20-%20primera%20evaluacion/03-reparto-calculo/proyecto/`
- Abre 4 ventanas del navegador, a ser posible visibles a la vez (una de maestro y tres de esclavo). Si tienes otro ordenador o el móvil en la misma red, mejor: usa la IP del equipo.
- Valores para grabar: 100 ventas por paquete (24 paquetes) y carga 30 000 000. Ensaya antes: debe durar lo bastante para hablar. Si una mesa sale en rojo mientras ese esclavo sigue trabajando, baja la carga.
- Pon las ventanas de esclavo una al lado de otra y a la vista: el navegador frena las pestañas ocultas.
- Pulsa "Reiniciar" antes de grabar.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Página del maestro | Es como corregir un montón de exámenes entre varios. Aquí: las ventas de una cadena de papelerías ficticia. |
| 0:20-0:40 | Ventanas de esclavos (pulsar "Soy un esclavo" en dos o tres) | Cada navegador hace de esclavo y calcula con un worker. |
| 0:40-1:00 | "Preparar trabajo": las fichas salen del montón a las mesas | Cada paquete va a la mesa de quien lo tiene; el candado se ilumina al cogerlo. |
| 1:00-1:20 | Cerrar una ventana de esclavo mientras calcula | Su mesa se pone en rojo con cuenta atrás; a los 30 s otro se queda el paquete. |
| 1:20-1:50 | Barras que crecen, paquete recuperado y mensaje "Comprobado" | Ingresos por tienda; la suma coincide con la del archivo aunque un esclavo desapareciera. |
| 1:50-2:15 | Código `php/trabajo.php` (líneas 17-48) | Candado `flock` para que nadie coja el mismo paquete; si un esclavo se cae, a los 30 s se reasigna. |
| 2:15-2:30 | Tabla de mediciones | 74 s con 1 frente a 31 s con 8; mi equipo tiene 4 núcleos. Cierre: aula controlada, sin contraseñas, mejora con base de datos. |

## Plan B
- No hay más ordenadores: usa varias ventanas.
- Va demasiado rápido: sube la carga a 20 000 000 o baja las filas por paquete.
- La escena no se mueve: pulsa "Reiniciar" y "Preparar trabajo" otra vez, y recarga la página con Ctrl+F5 para no usar archivos antiguos.
- Muestra `pruebas/salida-concurrencia.txt` y `salida-perdido.txt` como evidencia.
