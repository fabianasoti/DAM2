# Guion de vídeo: Reparto de cálculo (objetivo 2 min 30 s)

## Preparativos
- Apache en marcha. URL: `http://localhost/Github/DAM2/DAM2/003-Programaci%C3%B3n%20de%20servicios%20y%20procesos/Entrega%20final%20-%20primera%20evaluacion/03-reparto-calculo/proyecto/`
- Abre 4 ventanas del navegador, a ser posible visibles a la vez (una de maestro y tres de esclavo). Si tienes otro ordenador o el móvil en la misma red, mejor: usa la IP del equipo.
- Ensaya antes con carga 10 000 000 y paquetes de 40: debe verse el tablero avanzar unos segundos. Si va demasiado rápido o lento, ajusta la carga.
- Pulsa "Reiniciar" antes de grabar.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Página del maestro | Cadena de papelerías ficticia: ¿cuánto ingresó cada tienda? Un solo ordenador tarda; repartimos. |
| 0:20-0:40 | Ventanas de esclavos (pulsar "Soy un esclavo" en dos o tres) | Cada navegador hace de esclavo y calcula con un worker. |
| 0:40-1:20 | "Preparar trabajo" y tablero que se va llenando | Paquetes pendientes, en marcha y terminados. Quién ha hecho cuántos. |
| 1:20-1:50 | Resultado y mensaje "Comprobado" | Ingresos por tienda; la suma coincide con la del archivo. |
| 1:50-2:15 | Código `php/trabajo.php` (líneas 17-48) | Candado `flock` para que nadie coja el mismo paquete; si un esclavo se cae, a los 30 s se reasigna. |
| 2:15-2:30 | Tabla de mediciones | 74 s con 1 frente a 31 s con 8; mi equipo tiene 4 núcleos. Cierre: aula controlada, sin contraseñas, mejora con base de datos. |

## Plan B
- No hay más ordenadores: usa varias ventanas.
- Va demasiado rápido: sube la carga a 20 000 000 o baja las filas por paquete.
- El tablero no se mueve: pulsa "Reiniciar" y "Preparar trabajo" otra vez.
- Muestra `pruebas/salida-concurrencia.txt` y `salida-perdido.txt` como evidencia.
