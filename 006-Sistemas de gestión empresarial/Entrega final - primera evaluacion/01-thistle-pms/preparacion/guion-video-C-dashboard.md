# Guion de vídeo C: Dashboard y extracción de datos (objetivo 2 min 30 s)

## Preparativos
- `php -S localhost:8000` desde `proyecto/`. Entra como administración o recepción → Informes → Dashboard.
- Ten abierto `api/kpis.php` (líneas 32-48) y `servicios/exportar_programado.php`. Prepara una terminal en `proyecto/`.
- Ensaya la exportación programada: `php servicios/exportar_programado.php` y mira `data/exportaciones/log.txt`.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Dashboard | La dirección quiere saber cómo va el negocio sin hojas de cálculo. |
| 0:20-0:50 | Tarjetas | Ocupación hoy, llegadas, salidas, ADR y RevPAR. |
| 0:50-1:20 | Gráficas; pasar el ratón por una barra | Doce meses; cada gráfica lleva su fórmula debajo. |
| 1:20-1:50 | `kpis.php`: consulta recursiva | Los meses se generan en SQL y cada reserva reparte su importe entre sus noches. |
| 1:50-2:15 | Exportar datos y `php servicios/exportar_programado.php` | CSV/JSON sin contraseñas y copia programada con registro. |
| 2:15-2:30 | `salida-api.txt` (meses contrastados) | Comparado con un cálculo independiente. Límite: no hay comparación interanual. |

## Plan B
- El dashboard tarda: la consulta mensual tarda 56 ms en mi equipo; si ves más, recarga.
- Sin SQLite en PHP no arranca: ver `00-plan.md` para el comando.
- Muestra `mediciones/rendimiento.txt` si quieres hablar de rendimiento.
