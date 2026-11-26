# Chuleta de posts: ERP hotelero Thistle (Sistemas de gestión empresarial)

4 posts, uno por aspecto, del mismo proyecto: reservas, tablero, dashboard y seguridad.

**Ojo:** el profe prohíbe usar IA para limpiar el texto. Los ejemplos son para ver la forma y el tono. No los copies: escribe el tuyo con las frases sueltas.

## Qué pide la rúbrica en todos (4 a 6 párrafos)
| Párrafo | Cuántos | Debe tener |
|---|---|---|
| Introducción | 1 | Una necesidad humana, quién la tiene y qué le cuesta. Sin empezar por tecnologías. |
| Para qué sirve | 1-2 | A quién ayuda, qué mejora, un ejemplo de uso y una cifra comprobable. |
| Técnica | 1-2 | Dos decisiones con su porqué y su coste, cómo lo verificaste y dónde se ejecuta. |
| Cierre | 1 | Volver al problema, qué falta, qué mejorarías y dar las gracias. |

**Frase de la IA (opcional, una sola, en la parte técnica):** "Usé un asistente de IA para escribir y probar código; las decisiones fueron mías y revisé los resultados."

## Antes de grabar cualquiera
Desde `01-thistle-pms/proyecto/`: `php -S localhost:8000` y abrir `http://localhost:8000/login.html`. Contraseña de todos: `Thistle2026!`
- Recepción: `sergio.molina@cardomarino.example` · Admin: `lucia.ferrer@…`
- Limpieza: `rosa.delgado@…` · Mantenimiento: `pablo.navarro@…`

---

# A. Reservas y disponibilidad

**En una frase:** reservar habitaciones sin que dos personas acaben en la misma. **Para quién:** la recepción de un hotel pequeño.

## Vídeo (2 min 30 s)
| Tiempo | Qué se ve | Qué digo |
|---|---|---|
| 0:00-0:20 | Reservas | El problema de reservar dos veces. |
| 0:20-1:00 | "Nueva reserva" y buscar | Solo salen las libres, con precio por temporada. |
| 1:00-1:30 | Elegir cliente y confirmar | El servidor calcula el importe. |
| 1:30-1:50 | Repetir habitación y fechas | La rechaza. |
| 1:50-2:30 | `reservas.php` y `schema.sql` | Transacción y disparador; límites. |

## Frases sueltas
- **Intro:** hoja de cálculo · huésped en la puerta · habitación ya ocupada
- **Para qué sirve:** disponibilidad · precio por noche y temporada · check-in y check-out cambian la habitación
- **Técnica:** transacción · disparador en la base de datos · estados permitidos · índice
- **Cierre:** no se pueden modificar reservas · sin pagos

**Cifras:** 12 reservas a la vez de la misma habitación, 1 aceptada · comprobación de 35 ms a 0,48 ms con índice (casi 5000 reservas).
**Limitación:** no se modifican reservas ni hay pagos. **Mejora:** tarifas por canal.

## Ejemplo (5 párrafos)
En un hotel pequeño, reservar dos veces la misma habitación se descubre cuando ya hay un huésped en la puerta. Evitarlo a base de revisar una hoja de cálculo no es fiable.

En mi ERP hotelero, recepción elige las fechas y ve solo las habitaciones libres, con el precio según la temporada de cada noche. Al hacer el check-in o el check-out, la habitación cambia de estado sola.

Antes de guardar, el servidor valida las fechas y comprueba la disponibilidad dentro de una transacción. Además, la base de datos tiene un disparador que impide dos reservas que se pisen, aunque falle el resto. Está hecho con PHP y SQLite.

En las pruebas, de doce peticiones a la vez para la misma habitación se aceptó una. Con casi cinco mil reservas, un índice bajó la comprobación de 35 a menos de 1 milisegundo.

Aún no permite modificar reservas ni cobrar. Es la base de algo que quiero seguir ampliando. ¡Gracias por leer!

---

# B. Tablero de recepción

**En una frase:** ver todo el hotel de un vistazo. **Para quién:** recepción.

## Vídeo (2 min 30 s)
| Tiempo | Qué se ve | Qué digo |
|---|---|---|
| 0:00-0:20 | Tablero | Saber qué pasa sin abrir cinco pantallas. |
| 0:20-0:50 | Plano y leyenda | Cada color es un estado. |
| 0:50-1:20 | Llegadas y salidas de hoy | Check-in solo si la habitación está lista. |
| 1:20-1:50 | Calendario, pulsar celda vacía | Reservar desde el calendario. |
| 1:50-2:30 | Entrar como limpieza | No ve nombres; el servidor no los envía. |

## Frases sueltas
- **Intro:** cola en recepción · qué está libre, qué está sucio, quién llega
- **Para qué sirve:** plano por plantas · colores · llegadas y salidas · calendario de 14 días
- **Técnica:** sin librerías · calendario con celdas que ocupan varias noches · una sola petición · datos según el rol
- **Cierre:** no se arrastran reservas · cambiar de semana

**Cifras:** 50 habitaciones y 14 días · el tablero responde en 2,6 ms.
**Limitación:** no se mueven reservas arrastrando. **Mejora:** navegar por semanas.

## Ejemplo (5 párrafos)
Cuando hay cola en recepción, no hay tiempo de abrir varias pantallas para saber qué habitaciones están libres, cuáles hay que limpiar y quién llega hoy.

Diseñé un tablero que lo junta todo: las 50 habitaciones por plantas, cada estado con su color, las llegadas y salidas de hoy con un botón y un calendario de catorce días donde pulsas una celda para reservar.

Está hecho sin librerías, con los colores de mi manual de identidad. Cada reserva del calendario es una celda que ocupa tantas columnas como noches. Limpieza ve el estado de las habitaciones, pero no los nombres de los huéspedes, porque el servidor ni siquiera se los envía.

Las pruebas confirman que cada fila del calendario ocupa exactamente catorce columnas y que el tablero responde en pocos milisegundos.

Todavía no se pueden arrastrar reservas ni cambiar de semana, y esas serían mis siguientes mejoras. ¡Gracias por leer!

---

# C. Dashboard y extracción de datos

**En una frase:** saber cómo va el negocio con cifras reales. **Para quién:** la dirección del hotel.

## Vídeo (2 min 30 s)
| Tiempo | Qué se ve | Qué digo |
|---|---|---|
| 0:00-0:20 | Dashboard | Respuestas sin hojas de cálculo. |
| 0:20-0:50 | Tarjetas | Ocupación, precio medio e ingresos por habitación. |
| 0:50-1:20 | Gráficas, ratón sobre una barra | 12 meses, cada una con su fórmula. |
| 1:20-1:50 | `kpis.php` | Todo sale de consultas SQL. |
| 1:50-2:30 | Exportar y `exportar_programado.php` | CSV y copia programada, sin contraseñas. |

## Frases sueltas
- **Intro:** cuánta ocupación · a qué precio · qué canal trae más
- **Para qué sirve:** doce meses · próximos 14 días · exportar
- **Técnica:** consultas SQL · gráficas SVG propias · exportación programada · sin contraseñas
- **Cierre:** sin comparación interanual · tabla resumen

**Vocabulario:** ADR = precio medio por noche vendida · RevPAR = ingresos por habitación disponible.
**Cifras:** responde en 56 ms con casi 5000 reservas · 12 meses comprobados con un cálculo aparte.
**Limitación:** no compara con el año anterior. **Mejora:** comparación interanual.

## Ejemplo (5 párrafos)
Quien dirige un hotel necesita saber cuánto se ha ocupado, a qué precio medio y qué canal trae más reservas. Si la información está en hojas sueltas, cada pregunta lleva un buen rato.

Mi panel muestra ocupación, precio medio por noche e ingresos por habitación de los últimos doce meses, los ingresos por canal y las habitaciones ocupadas en las próximas dos semanas. Los datos se pueden exportar.

Todo se calcula con consultas SQL, y bajo cada gráfica está la fórmula. Las gráficas están dibujadas a mano, sin librerías. Una tarea programada hace copias en CSV y JSON, que nunca incluyen contraseñas.

Los doce meses se compararon con un cálculo hecho aparte y coincidieron. El panel responde en unos 56 milisegundos con casi cinco mil reservas de ejemplo.

Todavía no compara con el año anterior, y sería lo siguiente que añadiría. ¡Gracias por leer!

---

# D. Seguridad, roles y mantenimiento

**En una frase:** cada persona ve y hace solo lo que le toca. **Para quién:** el personal del hotel.

## Vídeo (2 min 30 s)
| Tiempo | Qué se ve | Qué digo |
|---|---|---|
| 0:00-0:20 | Login | No todos deben ver lo mismo. |
| 0:20-0:50 | 5 intentos mal (usa `irene.campos@…`) | Se bloquea, aunque luego sea la buena. |
| 0:50-1:20 | Limpieza resuelve un parte | La habitación queda disponible. |
| 1:20-1:50 | Avería urgente | La habitación se bloquea. |
| 1:50-2:30 | Auditoría y `sesion.php` | Contraseñas cifradas y registro. |

## Frases sueltas
- **Intro:** recepción, limpieza, mantenimiento · datos de huéspedes
- **Para qué sirve:** cada rol lo suyo · avería que bloquea · limpieza que libera · saber quién hizo qué
- **Técnica:** contraseñas cifradas · bloqueo tras 5 intentos · permisos en el servidor · consultas preparadas
- **Cierre:** falta HTTPS y doble factor

**Cifras:** 5 intentos y bloqueo de 10 minutos · 109 comprobaciones del servidor correctas.
**Limitación:** sin HTTPS ni recuperación de contraseña. **Mejora:** doble factor.

## Ejemplo (5 párrafos)
En un hotel trabajan recepción, limpieza, mantenimiento y dirección. No todos necesitan ver los datos de los huéspedes, y cuando algo falla conviene saber quién hizo qué.

En mi ERP cada persona entra con su cuenta y su rol. Limpieza ve qué habitaciones preparar, mantenimiento ve las averías y una avería urgente bloquea la habitación hasta que se resuelve.

Los permisos se comprueban en el servidor, no solo escondiendo botones. Las contraseñas se guardan cifradas, tras cinco intentos fallidos el acceso se bloquea y las acciones importantes quedan registradas.

En 109 pruebas del servidor, cada rol accede solo a lo suyo y el bloqueo funciona. Las pruebas sacaron un fallo, se creaban sesiones a visitantes sin identificar, y se corrigió.

Para usarlo de verdad faltaría cifrar la conexión con HTTPS y añadir doble factor. ¡Gracias por leer!
