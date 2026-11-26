# Guion de vídeo B: Tablero de recepción (objetivo 2 min 30 s)

## Preparativos
- `php -S localhost:8000` desde `proyecto/`. Entra como recepción y ve a Recepción → Tablero.
- Si puedes, abre una segunda ventana en privado con `rosa.delgado@cardomarino.example` (limpieza) para comparar.
- Busca antes una llegada de hoy con la habitación disponible (botón activo) y otra con la habitación sucia u ocupada (botón desactivado).

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Tablero completo | Recepción necesita ver el hotel entero de un vistazo. |
| 0:20-0:50 | Plano por plantas y leyenda; pulsar "Sucias" | Cada habitación tiene el color de su estado; la leyenda destaca. |
| 0:50-1:20 | Llegadas de hoy: check-in; una con botón desactivado | Solo se puede hacer check-in si la habitación está lista. |
| 1:20-1:50 | Calendario de 14 días; pulsar una celda vacía | Reservar directamente desde el calendario. |
| 1:50-2:15 | Ventana de limpieza: sin nombres ni calendario | Cada rol ve lo que necesita; el servidor no envía lo demás. |
| 2:15-2:30 | Código `pintarCalendario` (`colspan`) | Una celda por reserva con `colspan`. Límite: no se arrastran reservas. |

## Plan B
- No hay llegadas hoy: crea una con llegada hoy desde "Nueva reserva".
- Se ve cargando: recarga la página y comprueba que el servidor sigue activo.
- Cuéntalo con sinceridad si no has visto el aspecto en un navegador real antes de grabar.
