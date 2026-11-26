# Guion de vídeo D: Seguridad, roles y mantenimiento (objetivo 2 min 30 s)

## Preparativos
- `php -S localhost:8000` desde `proyecto/`. Tres ventanas: recepción, limpieza y administración (usa ventanas privadas distintas para no compartir sesión).
- Ten abiertos `api/sesion.php` (líneas 20-58) y la vista Auditoría.
- Ensaya el bloqueo con `irene.campos@cardomarino.example`: cinco contraseñas mal, y luego la buena.

## Guion
| Tiempo | Qué se ve | Qué digo (ideas, no frases) |
|---|---|---|
| 0:00-0:20 | Pantalla de login | En un hotel no todos deben ver lo mismo. |
| 0:20-0:50 | Cinco intentos fallidos y bloqueo | Tras cinco intentos se bloquea el acceso, aunque luego pongas la contraseña correcta. |
| 0:50-1:20 | Limpieza resuelve un parte; la habitación queda disponible | Limpieza solo ve lo suyo y no hay nombres de huéspedes. |
| 1:20-1:50 | Avería urgente: la habitación se bloquea; ya no se puede reservar | La avería bloquea la habitación hasta que mantenimiento la resuelve. |
| 1:50-2:15 | Código `sesion.php`: `password_hash`, bloqueo, mismo mensaje | Contraseñas cifradas; permisos en el servidor, no solo en el menú. |
| 2:15-2:30 | Auditoría y `salida-api.txt` | Queda registro; 109 pruebas. Límite: falta HTTPS y doble factor. |

## Plan B
- Si te bloqueas tú: espera 10 minutos o reinstala con `php servicios/instalar.php --forzar`.
- No hay averías: créala desde Operaciones → Averías.
- No enseñes contraseñas reales en pantalla: las de ejemplo son públicas.
