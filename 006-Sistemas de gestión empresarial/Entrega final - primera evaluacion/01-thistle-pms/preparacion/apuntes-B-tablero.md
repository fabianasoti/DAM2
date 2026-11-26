# Aspecto B: Tablero de recepción

## 1. Resumen en 3 líneas
Una pantalla que enseña de un vistazo cómo está el hotel: el plano de las 50 habitaciones por planta y color de estado, las llegadas y salidas de hoy con sus botones de check-in y check-out, y un calendario de ocupación de 14 días. Está hecha sin librerías. Cada rol ve solo lo que necesita: limpieza y mantenimiento ven el estado de las habitaciones pero no los nombres de los huéspedes.

## 2. Mapa de archivos y recorrido
`js/tablero.js` (plano, lista de llegadas y salidas, calendario, panel de habitación) → `api/tablero.php` (una sola petición con todo) → tablas `habitaciones`, `reservas`, `clientes`, `mantenimiento`. Colores en `css/estilo.css` (tokens de tu manual). Las acciones (check-in, nueva reserva) reutilizan `js/reservas.js`.

## 3. Fragmentos clave
**B1. `api/tablero.php` líneas 9-30 y 28-56:** una consulta devuelve las habitaciones con dos subconsultas (averías y limpiezas abiertas); solo si el rol es admin o recepción se añaden el huésped actual, las llegadas, las salidas y las reservas del calendario. Concepto: datos mínimos por rol, en el servidor.

**B2. `js/tablero.js` líneas 100-148 (`pintarCalendario`):** para cada habitación recorre los 14 días; si una reserva cubre el día, dibuja **una sola celda con `colspan`** igual a las noches que le quedan dentro del calendario, y salta esos días; si no, dibuja una celda vacía en la que se puede pulsar para reservar. Concepto: construir una tabla a partir de datos.

**B3. `js/tablero.js` líneas 11-80:** agrupa las habitaciones por planta, crea una casilla por habitación con su color y, al pulsar un estado de la leyenda, atenúa las demás. Concepto: interfaz reactiva con JavaScript puro.

**B4. `css/estilo.css` líneas 152-155:** un color por estado usando las variables de tu manual (verde disponible, azul bosque ocupada, amarillo sucia, rojo mantenimiento). Concepto: sistema de diseño con tokens.

**B5. `js/nucleo.js` líneas 5-25 (`h`):** función que crea elementos y añade el texto como texto, no como HTML. Concepto: evitar la inyección de código en la interfaz.

## 4. Conceptos de la unidad aplicados
Diseño de interfaces para un ERP (cuadro de mando operativo, color como código de estado, ayuda visual); consultas con agregados y subconsultas; separación cliente-servidor; control de acceso por rol; accesibilidad básica (botones reales, `title`, foco visible).

## 5. Decisiones técnicas
- **Una sola llamada** (`tablero.php`) en vez de varias: menos peticiones y todo coherente en el mismo instante. Coste: la respuesta pesa unos 28 KB.
- **Tabla con `colspan`** para el calendario en vez de un diagrama dibujado: es accesible y se alinea sola. Coste: no se pueden solapar barras (no hace falta, porque no hay solapes).
- **Sin librerías:** control total y nada que instalar. Coste: hay que escribir más código.
- **Datos filtrados en el servidor, no ocultos en el navegador:** si un rol no debe ver un nombre, el nombre ni viaja.
- **Calendario de 14 días fijos desde hoy:** simple y suficiente para recepción.

## 6. Ejecución y datos
Entrar como recepción → Recepción → Tablero. Datos: 50 habitaciones (24 ocupadas, 19 disponibles, 5 sucias y 2 en mantenimiento con la base de ejemplo) y las reservas de los próximos 14 días. Un punto rosa en una casilla indica partes de trabajo abiertos.

## 7. Verificación (real, con navegador simulado)
- El tablero dibuja 50 habitaciones; la leyenda suma 50 (19 + 24 + 5 + 2); pulsar un estado destaca solo esas habitaciones.
- El calendario tiene 50 filas y 14 días, y **cada fila ocupa exactamente 14 columnas** aunque haya reservas largas con `colspan`.
- Pulsar una celda vacía abre "Nueva reserva" con la fecha puesta y la habitación elegida.
- Limpieza ve el estado de las 50 habitaciones, pero **sin nombres de huéspedes y sin calendario**; en el servidor, `tablero.php` no envía esos datos a ese rol.
- `tablero.php` responde en 2,6 ms de mediana (28 KB).
- Los nombres con etiquetas HTML se muestran como texto y no se ejecutan.
- **Sin verificar:** el aspecto real (colores, espaciado, adaptación a pantalla) en un navegador de verdad.

## 8. Limitaciones y mejora
No se pueden arrastrar reservas para moverlas; el calendario no avanza ni retrocede; con muchas habitaciones habría que paginar. Mejora: navegar por semanas y mover reservas arrastrando.

## 9. Chuleta de defensa
1. **¿Cómo dibujas el calendario?** Una tabla con una fila por habitación; cada reserva es una celda con `colspan` igual a sus noches dentro del rango.
2. **¿Por qué no usas una librería?** Para controlar el resultado y no depender de terceros; el coste es más código propio.
3. **¿Qué ve limpieza?** El estado de las habitaciones sin nombres de huéspedes ni calendario; el servidor ni siquiera los envía.
4. **¿Cómo se eligieron los colores?** De los tokens de tu manual de identidad: cada estado tiene un color de significado fijo.
5. **¿Qué pasa si alguien pulsa una habitación?** Se abre un panel con su información y acciones según el rol.

## 10. Glosario
- **Tablero (rack) de recepción:** vista general del estado del hotel.
- **colspan:** atributo de celda de tabla que ocupa varias columnas.
- **Token de diseño:** variable con un color o medida con significado.
- **Leyenda interactiva:** etiquetas que sirven para filtrar.
- **Planta:** piso del hotel.
- **Parte de trabajo:** aviso de limpieza o avería.
- **Atenuar:** bajar la opacidad de lo que no interesa.
- **Datos mínimos:** enviar a cada rol solo lo que necesita.

## 11. Piezas para el post
- **Intro:** recepción necesita ver el hotel entero sin abrir cinco pantallas (hipótesis).
- **Para qué sirve:** plano por colores, llegadas y salidas de hoy con un clic, calendario de 14 días, reserva pulsando una celda.
- **Técnica:** sin librerías; calendario con `colspan`; una sola petición; datos por rol filtrados en el servidor.
- **Verificación:** 50 filas × 14 columnas exactas; limpieza no recibe nombres; 2,6 ms; sin ver aún en un navegador real.
- **Cierre:** falta arrastrar reservas y navegar por semanas.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
Cuando llegas a la recepción de un hotel, lo primero que necesitas saber es qué habitaciones están libres, cuáles hay que limpiar y quién llega hoy. Si hay que abrir varias pantallas para saberlo, se pierde tiempo justo cuando hay cola.

Por eso diseñé un tablero de recepción. Muestra las cincuenta habitaciones por plantas, cada una de un color según su estado, con las llegadas y salidas de hoy al lado y botones para hacer el check-in o el check-out. Debajo hay un calendario de catorce días donde basta pulsar una celda vacía para empezar una reserva.

Está hecho sin librerías. El calendario es una tabla en la que cada reserva es una sola celda que ocupa tantas columnas como noches tiene, y todo llega en una única petición al servidor. Los colores salen de mi manual de identidad, así que cada estado tiene un color fijo.

Una decisión importante es quién ve qué. El personal de limpieza ve el estado de las habitaciones, pero no los nombres de los huéspedes ni el calendario, y no se esconden en el navegador: el servidor no los envía. Lo comprobé con pruebas y también que cada fila del calendario ocupa exactamente catorce columnas. [Añade si lo has visto en un navegador real.]

Todavía no se pueden arrastrar reservas ni cambiar de semana en el calendario. Esas serían las siguientes mejoras de un sistema que es un paso hacia mi proyecto final. [Cierra con tu agradecimiento.]
