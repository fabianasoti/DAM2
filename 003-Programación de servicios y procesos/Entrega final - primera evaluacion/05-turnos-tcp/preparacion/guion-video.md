# Guion de vídeo: Sistema de turnos (objetivo 2 min)

## Preparativos
- Cuatro terminales visibles: servidor, pantalla (grande), mostrador y clientes.
- `python3 servidor.py`, `python3 cliente.py pantalla`, `python3 cliente.py mostrador 1`, y un segundo mostrador si puedes.
- Haz un ensayo antes con tres nombres. Reinicia el servidor antes de grabar para empezar en el turno 1.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Las cuatro terminales | Problema: esperar sin saber cuándo toca. Sistema de turnos en una red local. |
| 0:20-0:50 | `cliente.py pedir Ana`, `pedir Luis`, `pedir Marta` | Cada persona recibe su turno y cuántas hay delante. |
| 0:50-1:20 | Mostrador pulsa Enter; la pantalla cambia | El mostrador llama al siguiente y la pantalla lo muestra al instante. |
| 1:20-1:40 | `pedir Ana123` y un mostrador vacío | El servidor rechaza nombres no válidos y avisa cuando no hay nadie. |
| 1:40-2:00 | Código `servidor.py` (líneas 61-65) y `salida-pruebas.txt` | Un hilo por cliente; el candado evita turnos repetidos; 300 clientes a la vez, 300 turnos distintos. Límites: sin contraseña ni persistencia. |

## Plan B
- El puerto está ocupado: arranca con otro puerto (`python3 servidor.py 5051`) y añade `127.0.0.1 5051` a los clientes.
- La pantalla no se limpia: es una terminal sin colores; no afecta al funcionamiento.
- Muestra `pruebas/salida-pruebas.txt` como evidencia.
