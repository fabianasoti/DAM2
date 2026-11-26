# Apuntes generales: Thistle PMS (para los 4 aspectos)

Los apuntes específicos de cada aspecto están en `apuntes-A-reservas.md`, `apuntes-B-tablero.md`, `apuntes-C-dashboard.md` y `apuntes-D-seguridad.md`. Aquí está lo que comparten: arquitectura, modelo de datos, consultas importantes y cómo arrancarlo.

## 1. Resumen
Un PMS (sistema de gestión hotelera) para un hotel pequeño ficticio, el "Hotel Cardo Marino" (50 habitaciones, 5 plantas). Gestiona reservas con disponibilidad y precio por temporada, el estado de cada habitación, las averías y la limpieza, y muestra indicadores hoteleros. Sale de tu ERP de clase (núcleo, API, datos) y es el paso previo a tu TFG. Usa tu identidad corporativa (`css/tokens.css`).

## 2. Mapa de archivos
| Carpeta | Contenido |
|---|---|
| `index.html`, `login.html` | Aplicación y pantalla de entrada. |
| `api/` | Servicios PHP que devuelven JSON: `sesion`, `crud` (genérico), `reservas`, `tablero`, `kpis`, `mantenimiento`, más `comun.php` (funciones compartidas) y `entidades.php` (campos y permisos). |
| `js/` | `nucleo.js` (helpers, avisos, panel), `principal.js` (menú por rol), una vista por módulo, `graficas.js` (SVG a mano). |
| `data/` | `schema.sql`, `config.json` y `.htaccess` (bloquea la descarga). La base `thistle.db` se crea sola al primer acceso. |
| `servicios/` | `instalar.php` (datos de ejemplo), `salida.php` y `entrada.php` (CSV/JSON), `exportar_programado.php` (cron). |

Orden: el navegador abre `login.html` → `api/sesion.php` valida y crea la sesión → `index.html` pide `sesion.php?accion=yo` y dibuja el menú según el rol → cada vista llama a su API.

## 3. Arquitectura y decisiones
- **Cliente-servidor estricto** (HTML/JS + PHP + fetch con JSON), como en clase. Alternativa descartada: PHP que genera el HTML; se pierde la separación y las pruebas independientes.
- **SQLite**: sin servidor, un solo archivo; tu profe lo recomienda para prototipar. Coste: un solo escritor a la vez (se gestiona con transacciones). Alternativa: MySQL, que ya tienes en el equipo.
- **Una API por módulo + un CRUD genérico** para las entidades simples. La lógica de negocio (reservas, mantenimiento) está en el servidor, nunca en el navegador.
- **Los permisos se deciden en el servidor** (`exigir_rol`); el menú del navegador solo es comodidad.
- **Sin librerías**: gráficas SVG, calendario y plano hechos a mano.

## 4. Modelo de datos
```
usuarios (1) ──< mantenimiento >── (1) habitaciones (1) ──< reservas >── (1) clientes
usuarios (1) ──< auditoria                temporadas (suelta: multiplicador de precio)
                                          intentos_login (suelta: bloqueo de fuerza bruta)
```
| Entidad | Claves y restricciones principales |
|---|---|
| `habitaciones` | `numero` único; `tipo` (Individual, Doble, Suite); `estado` (disponible, ocupada, sucia, mantenimiento); `precio_noche > 0`. |
| `clientes` | `dni_pasaporte` único; email opcional. |
| `reservas` | FK a habitación y cliente; `CHECK fecha_salida > fecha_entrada`; `estado` (confirmada, check-in, check-out, cancelada); `canal` (directo, web, agencia, telefono); `importe_total`. **Disparadores** que impiden solapes. |
| `temporadas` | rango de fechas y multiplicador (baja 0,85; media 1,00; alta 1,35; Navidad 1,25). |
| `mantenimiento` | FK a habitación y usuario (asignado); `tipo` (avería, limpieza); `prioridad`; `estado`. |
| `usuarios` | `rol` (admin, recepcion, mantenimiento, limpieza); `password_hash` (nunca la contraseña). |
| `auditoria` | quién hizo qué y cuándo. |

## 5. Consultas importantes (reales)
**¿Hay solape?** (`api/reservas.php` 37-44, y el mismo criterio en los disparadores)
```sql
SELECT COUNT(*) FROM reservas
WHERE habitacion_id = ? AND estado <> 'cancelada' AND id <> ?
  AND fecha_entrada < :salida AND :entrada < fecha_salida
```
Dos estancias se pisan si cada una empieza antes de que termine la otra. Salir un día y entrar otro en la misma fecha no es solape.

**Habitaciones disponibles** (`api/reservas.php` 99-120): las que no están en mantenimiento, caben los huéspedes y `NOT EXISTS` una reserva activa que se pise.

**Ocupación, ingresos por mes** (`api/kpis.php` 32-48): `WITH RECURSIVE` genera los 12 meses y para cada reserva cuenta las noches que caen dentro del mes con `MIN(salida, fin_mes) − MAX(entrada, inicio_mes)`; el importe se reparte entre sus noches.

**Próximos 14 días** (`api/kpis.php` 72-83): otra CTE recursiva de días con subconsultas que cuentan ocupadas, llegadas y salidas.

## 6. Ejecución y datos
Opción rápida (sin Apache), desde `proyecto/`:
```
php -S localhost:8000
```
y abrir `http://localhost:8000/login.html`. Con Apache: `http://localhost/Github/DAM2/DAM2/006-Sistemas%20de%20gesti%C3%B3n%20empresarial/Entrega%20final%20-%20primera%20evaluacion/01-thistle-pms/proyecto/login.html`.
Requisito: la extensión SQLite de PHP (`sudo apt install php8.3-sqlite3`; con Apache, después `sudo systemctl restart apache2` y permiso de escritura en `data/`: `sudo chown -R www-data:www-data data`).
Datos de ejemplo (inventados): 50 habitaciones, 400 clientes (documentos `ZZ…`, correos `example.com`), unas 5000 reservas de un año atrás a tres meses adelante, 21 temporadas. Se calculan respecto a **hoy**, así siempre hay llegadas y salidas.
Usuarios (contraseña de todos: `Thistle2026!`): `lucia.ferrer@` (admin), `sergio.molina@` (recepción), `irene.campos@` (recepción), `pablo.navarro@` (mantenimiento), `rosa.delgado@` y `nuria.vidal@` (limpieza), todos con `@cardomarino.example`.

## 7. Verificación global
- API: 109 comprobaciones con PHP y SQLite reales (`pruebas/salida-api.txt`).
- Interfaz: 62 comprobaciones con un navegador simulado (`pruebas/salida-interfaz.txt`). **No es un navegador real.**
- Rendimiento medido (`mediciones/rendimiento.txt`).

## 8. Limitaciones
SQLite admite un solo escritor a la vez; no hay HTTPS ni recuperación de contraseña; no hay facturación ni pagos; el aspecto visual no lo he visto en un navegador real; las fuentes vienen de Google (hace falta internet, si no se usan las del sistema).
