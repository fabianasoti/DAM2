# Plan: Sistemas de gestión empresarial (entrega final, primera evaluación)

Un solo proyecto (`01-thistle-pms`: ERP hotelero en la línea de tu TFG) presentado con **4 aspectos**, cada uno con su vídeo y su texto. `proyecto/` es lo que va al generador de documentación; `preparacion/` queda fuera.

## Estado
| Aspecto | Apuntes | Guion | Guía de texto | Construido y probado | Falta (tú) |
|---|---|---|---|---|---|
| A. Reservas y disponibilidad | `apuntes-A-reservas.md` | `guion-video-A-reservas.md` | `guia-texto-A-reservas.md` | Sí (API y interfaz simulada) | Verlo en un navegador; grabar; escribir el texto |
| B. Tablero de recepción | `apuntes-B-tablero.md` | `guion-video-B-tablero.md` | `guia-texto-B-tablero.md` | Sí (interfaz simulada) | **Verlo en un navegador real** (colores y diseño); grabar; texto |
| C. Dashboard y extracción de datos | `apuntes-C-dashboard.md` | `guion-video-C-dashboard.md` | `guia-texto-C-dashboard.md` | Sí (contrastado con cálculo independiente) | Verlo en un navegador; probar la exportación con cron; grabar; texto |
| D. Seguridad, roles y mantenimiento | `apuntes-D-seguridad.md` | `guion-video-D-seguridad.md` | `guia-texto-D-seguridad.md` | Sí (109 pruebas de API) | Verlo en un navegador; grabar; texto |

Comunes: `apuntes-generales.md` (arquitectura, modelo de datos y consultas) y `ficha.md` (decisiones, mediciones, pruebas, fallos, limitaciones y evidencia por competencia).

## Orden para grabar (propuesto)
B (el más visual), A, D, C.

## Comandos que te tocan
Una vez (la extensión SQLite de PHP, que este equipo no tiene instalada):
```
sudo apt install php8.3-sqlite3
```
Para grabar, lo más sencillo (sin Apache), desde la carpeta `proyecto/`:
```
php -S localhost:8000
```
y abrir `http://localhost:8000/login.html`. La base de datos se crea sola al primer acceso. Con Apache, además: `sudo systemctl restart apache2` y `sudo chown -R www-data:www-data data` dentro de `proyecto/`. Usuarios y contraseña de ejemplo: ver `apuntes-generales.md`, sección 6.

## Decisiones abiertas (las tomamos juntas)
1. ¿Te gusta el nombre ficticio "Hotel Cardo Marino"? Se cambia en `proyecto/data/config.json`.
2. Hipótesis del problema y del usuario (en `ficha.md`): confírmala o cámbiala. No digas en el texto que has hablado con usuarios.
3. Competencia 2 (IA): la aplicación no usa IA. ¿Quieres contar tu uso del asistente?
4. Conexión con tu TFG: lo dejamos para más adelante (no he inventado nada de RoomOps).
5. Informe de `documentacion.jocarsa.com`: **uno por cada aspecto** (decidido).

## Pendiente de verificar por ti (no he podido: no hay navegador en este equipo)
- El aspecto real de la interfaz: colores, espaciado, adaptación a pantallas pequeñas y las fuentes (necesitan internet; si no, se usan las del sistema).
- Apache con permisos de escritura en `data/`.
- Una ejecución real de `exportar_programado.php` con cron.

## Lista de comprobación (la haces tú)
- [ ] Sesión de supervisión iniciada (condición imprescindible).
- [ ] Instalar `php8.3-sqlite3` y comprobar que la aplicación arranca.
- [ ] Repasar conmigo cada uno de los 4 apuntes (uno a uno).
- [ ] Verlo en un navegador real y avisarme de lo que no se vea bien.
- [ ] Informe markdown de cada aspecto (4) en `documentacion.jocarsa.com` y subirlos a `formacion.jocarsa.com`.
- [ ] Grabar los 4 vídeos de 1-3 min con sus guiones.
- [ ] Escribir tú los 4 textos de 4 a 6 párrafos, sin IA, y subir vídeos y textos a `red.jocarsa.com`.
- [ ] Comprobar que `proyecto/` no tiene `thistle.db`, `exportaciones/`, `Zone.Identifier` ni binarios (ahora está limpio: 31 archivos, 300 KB).

## Otras partes pendientes
- Programación de servicios y procesos: ver `003-…/Entrega final - primera evaluacion/00-plan.md`.
- Desarrollo de interfaces: esperar tus resultados de aprendizaje y proponer 2 o 3 ideas.
- Nada está commiteado. Tus versiones anteriores de thistle no se han tocado.
