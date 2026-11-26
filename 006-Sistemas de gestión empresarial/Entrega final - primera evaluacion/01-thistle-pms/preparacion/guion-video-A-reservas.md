# Guion de vídeo A: Reservas y disponibilidad (objetivo 2 min 30 s)

## Preparativos
- Desde `proyecto/`: `php -S localhost:8000` y abrir `http://localhost:8000/login.html`. Entra como `sergio.molina@cardomarino.example` (contraseña `Thistle2026!`).
- Ten abiertos `api/reservas.php` (líneas 123-160) y `data/schema.sql` (líneas 100-112) en el editor, y `pruebas/salida-api.txt`.
- Ensaya antes: elige unas fechas de aquí a dos semanas para tener varias habitaciones libres, y apunta una habitación que reservarás dos veces.
- Si usas Apache, la base se crea al primer acceso solo si PHP tiene SQLite y `data/` es escribible.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Pantalla de reservas | Problema: reservar dos veces la misma habitación en un hotel pequeño. Esta parte lo evita. |
| 0:20-1:00 | "Nueva reserva": fechas, huéspedes, "Buscar habitaciones" | Solo aparecen las libres, con el precio de cada una según la temporada de cada noche. |
| 1:00-1:30 | Elegir cliente, confirmar; aviso con noches e importe | Se guarda como confirmada; el importe lo calcula el servidor. |
| 1:30-1:50 | Repetir la misma habitación y fechas: error | "La habitación ya está reservada en esas fechas". |
| 1:50-2:15 | Código `reservas.php` (transacción) y `schema.sql` (disparador) | Dos defensas: transacción y disparador en la base de datos. |
| 2:15-2:30 | `salida-api.txt` (12 reservas simultáneas) | Doce peticiones a la vez: una aceptada y once rechazadas. Límite: no se pueden modificar reservas todavía. |

## Plan B
- No sale ninguna habitación libre: elige otras fechas o cancela una reserva futura.
- No conecta con la base: muestra `salida-api.txt` y explica el mensaje de error.
- Anota el importe y las noches que veas para el texto.
