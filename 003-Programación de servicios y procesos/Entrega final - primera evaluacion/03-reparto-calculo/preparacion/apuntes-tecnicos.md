# Apuntes técnicos: Reparto de cálculo entre ordenadores

## 1. Resumen en 3 líneas
Una cadena ficticia de papelerías quiere saber cuánto ingresó cada tienda en septiembre (2400 ventas). Un ordenador "maestro" parte el archivo en paquetes y varios "esclavos" (navegadores) los piden por turnos, los calculan con un worker y devuelven el resultado. El maestro los suma y comprueba que el total coincide con la suma directa.

### Para explicarlo: corregir exámenes (aplicación práctica)
Imagina que un profesor tiene que corregir un montón enorme de exámenes y pide ayuda.
| Con los exámenes | En el proyecto |
|---|---|
| Hace montoncitos de 100 exámenes | El maestro parte las ventas en paquetes (`preparar.php`) |
| Los deja en una mesa | La cola, con el estado de cada paquete |
| Cada compañero coge un montón, lo corrige, lo entrega y coge otro | Los esclavos piden, calculan y entregan (`trabajo.php`, `recepcion.php`) |
| A la mesa solo se acerca uno a la vez, para no coger el mismo montón | Candado `flock` |
| Si alguien se va a casa con un montón, pasado un rato se le da a otro | Paquete perdido: se reasigna a los 30 s |
| Antes de repartir se sabe cuántos exámenes había, y al final deben cuadrar | Comprobación contra la suma directa del archivo |

**Dónde sirve de verdad:** cuando hay mucho trabajo que se puede partir en trozos independientes y varias máquinas disponibles: corregir tests, procesar facturas o ventas, convertir vídeos o analizar imágenes. Aquí lo hago con las ventas de una cadena de papelerías ficticia.

## 2. Mapa de archivos
| Archivo | Qué hace |
|---|---|
| `index.html` | Una sola página; el botón decide si eres maestro o esclavo. |
| `js/principal.js` | Escena del maestro (pendientes, mesas, terminados, candado, barras), bucle del esclavo y envío al servidor. |
| `js/trabajador.js` | Worker: suma ingresos por tienda y unidades por producto de un paquete. |
| `php/comun.php` | Funciones comunes: abrir, leer y escribir la cola, responder JSON, validar nombres. |
| `php/preparar.php` | Lee el CSV, lo parte en paquetes y guarda la cola. |
| `php/trabajo.php` | Da un paquete a un esclavo (sección crítica con `flock`). |
| `php/recepcion.php` | Recibe el resultado de un paquete. |
| `php/estado.php` | Resume el estado, suma los resultados y dice qué paquete tiene cada esclavo. |
| `php/reiniciar.php` | Vacía la cola. |
| `datos/ventas.csv` | 2400 ventas inventadas. |

Orden: maestro pulsa "Preparar" (`preparar.php` crea la cola). Cada esclavo pide (`trabajo.php`), calcula (`trabajador.js`) y entrega (`recepcion.php`), y vuelve a pedir. El maestro consulta `estado.php` cada medio segundo y mueve cada paquete a su zona. La cola vive en un archivo JSON en la carpeta temporal del sistema.

## 3. Fragmentos clave
**A. `trabajo.php` líneas 17-48: reservar un paquete.** `flock(LOCK_EX)` bloquea el archivo: mientras un PHP busca y marca un paquete como "asignado", los demás esperan. Si un paquete lleva "asignado" más de 30 s se considera perdido y se da a otro. Concepto: exclusión mutua y tolerancia a fallos.

**B. `recepcion.php` líneas 14-50: aceptar un resultado.** Comprueba que los datos tienen forma correcta, que el paquete existe, que no está terminado y que lo entrega el mismo esclavo al que se asignó. Concepto: validación y coherencia.

**C. `preparar.php` líneas 20-35 y 55: partir y comprobar.** `array_chunk` parte las filas en paquetes; antes se calcula el importe total directamente y se guarda como "esperado". Concepto: reparto de datos y verificación.

**D. `trabajador.js` líneas 5-42: el cálculo.** Suma `unidades × precio` por tienda en céntimos (enteros) y añade una carga artificial para que se vea el reparto. Concepto: worker, trabajo en segundo plano.

**E. `principal.js` líneas 270-323: el bucle del esclavo.** Pide trabajo, lo manda al worker, entrega y vuelve a pedir; si no hay paquetes libres pero otros no han terminado, espera 2 s y pregunta de nuevo. Concepto: modelo maestro/esclavo.

**F. `principal.js` líneas 120-182 (`pintarEscena`) y 79-92 (`mover`): la escena.** Cada paquete es una ficha; según su estado va al montón de pendientes, a la mesa de su esclavo o a terminados. `mover` mide dónde estaba, la cambia de sitio y la desliza hasta el nuevo. Si un paquete lleva 8 s sin entregarse, su mesa se pone en rojo con la cuenta atrás. Concepto: monitorización visual de un sistema distribuido.

## 4. Conceptos de la unidad
Computación paralela y distribuida (maestro y esclavos); sección crítica y exclusión mutua (`flock`); sincronización; comunicación cliente-servidor con JSON por HTTP; workers; monitorización (escena de estado, segundos). Todos vistos en `005-Programación paralela y distribuida`; nada nuevo.

## 5. Decisiones técnicas
- **Cola en un archivo JSON con `flock`** (como en clase) frente a una base de datos: más sencillo, pero solo vale con un servidor y pocos paquetes.
- **Importes en céntimos enteros:** evita errores de decimales y permite comparar exacto.
- **Cola en la carpeta temporal:** PHP siempre puede escribir sin cambiar permisos.
- **Tiempo máximo de 30 s** por paquete: si un esclavo se cierra, otro lo rehace. Coste: un esclavo lento podría ser desplazado y su resultado se rechaza.
- **Escena animada** frente a un tablero de cuadrados: se ve quién tiene cada paquete y qué pasa si un esclavo desaparece. Coste: más código en la página.
- **El candado de la pantalla es una ilustración:** se ilumina cuando la página detecta que alguien ha cogido un paquete; no lee el estado real de `flock`, que dura milisegundos.
- **Carga artificial** configurable: con solo 2400 ventas no habría trabajo suficiente para ver nada; está explicado en la ficha.

## 6. Ejecución y datos
- Con Apache: `http://localhost/Github/DAM2/DAM2/003-Programaci%C3%B3n%20de%20servicios%20y%20procesos/Entrega%20final%20-%20primera%20evaluacion/03-reparto-calculo/proyecto/`. Sin dependencias.
- Datos: `ventas.csv` (fecha, tienda, producto, unidades, precio_centimos), inventados.
- Validación: tamaño de paquete (5-500) y carga (0-50 000 000) se limitan; el nombre del esclavo solo admite letras, números, `-` y `_` (`comun.php` línea 52); el resultado se comprueba antes de aceptarlo.
- Errores: el servidor devuelve `{ok:false, error}`; la página muestra el mensaje y, si se corta la conexión, reintenta cada 3 s.

## 7. Verificación (real, guardada en `preparacion/pruebas/`)
- **Concurrencia:** 16 esclavos a la vez, 480 paquetes: 480 entregados y 480 distintos (ninguno repetido), total coincide (78 376,10 €).
- **Entradas inválidas:** nombre de esclavo con caracteres raros, resultado roto, paquete inexistente, entrega de otro esclavo y entrega repetida: todos rechazados. Tamaño 0 y carga enorme se limitan.
- **Paquete perdido:** un esclavo coge un paquete y desaparece; otro lo recibe a los 31 s; cuando el primero reaparece, se rechaza su entrega. El total coincide.
- **Velocidad** (60 paquetes, esclavos como procesos): 1 esclavo 74,4 s, 2 → 49,8 s, 4 → 35,9 s, 8 → 30,9 s. El total coincide en todas.
- **Página** (navegador simulado contra el PHP real, 19 comprobaciones): las fichas se mueven entre zonas, aparecen las mesas, un esclavo que no entrega se pone en rojo y su paquete se reasigna, las barras y la comprobación salen bien, sin errores de JavaScript.
- Fallos reales al construir: ninguno detectado.
- **Sin probar:** varios ordenadores reales en red y navegador real.

## 8. Limitaciones y mejora
El aviso de "no responde" salta a los 8 s: un ordenador muy lento podría salir en rojo aunque siga trabajando. Un solo servidor; sin contraseña: cualquiera que abra la página puede ser esclavo (vale para un aula controlada); los esclavos no se identifican de verdad. Mejora: base de datos para la cola y autenticación.

## 9. Chuleta de defensa
1. **¿Qué es `flock`?** Un candado sobre un archivo: solo uno a la vez modifica la cola.
2. **¿Qué pasa si dos esclavos piden a la vez?** Uno espera al candado; nunca reciben el mismo paquete (probado con 16).
3. **¿Y si un esclavo se cae?** A los 30 s su paquete se da a otro; si reaparece, su resultado se rechaza.
4. **¿Cómo sabes que el resultado es correcto?** El maestro compara la suma de los esclavos con la suma directa del archivo.
5. **¿Por qué 8 esclavos no son 8 veces más rápidos?** El equipo tiene 4 núcleos físicos; 74 s pasó a 31 s (2,4 veces).

## 10. Glosario
- **Maestro/esclavo:** uno reparte, los otros trabajan.
- **Paquete:** trozo del archivo que se calcula de una vez.
- **Sección crítica:** parte del código que solo uno puede ejecutar a la vez.
- **flock:** candado de archivo.
- **Cola:** lista de paquetes con su estado.
- **Tolerancia a fallos:** seguir bien aunque un participante falle.
- **JSON:** formato de texto para intercambiar datos.
- **Céntimo entero:** guardar dinero sin decimales.

## 11. Piezas para el post
- **Intro:** una cadena de tiendas con datos de ventas; analizar todo en un ordenador tarda; repartirlo entre varios.
- **Para qué sirve:** ingresos por tienda y producto más vendido; escena en directo con mesas y fichas; ejemplo de los exámenes; varios equipos de un aula; comprobación del total.
- **Técnica:** maestro/esclavo por HTTP y JSON; `flock`; paquete perdido a los 30 s; céntimos enteros.
- **Verificación:** 16 esclavos, 480 paquetes, 0 repetidos; paquete perdido recuperado a los 31 s; 74,4 s frente a 30,9 s.
- **Cierre:** limitaciones (un servidor, sin contraseña); mejora: base de datos.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
Imagina una cadena de papelerías con miles de ventas al mes. Saber cuánto ha ingresado cada tienda parece sencillo, pero cuando los datos crecen un solo ordenador tarda y se queda ocupado. La pregunta es si se puede repartir el trabajo.

Eso hice con una aplicación en la que un ordenador hace de maestro y los demás de esclavos. El maestro parte las ventas en paquetes y cada esclavo coge uno, lo calcula y devuelve el resultado. Es como repartir un montón de exámenes entre compañeros: en pantalla se ve cada paquete salir del montón, llegar a la mesa de quien lo corrige y acabar en terminados, mientras crecen los ingresos de cada tienda.

Lo difícil es que dos ordenadores no cojan el mismo paquete. Lo resolví con un candado de archivo: mientras uno reserva un paquete, los demás esperan su turno. Además, si un esclavo se cierra a medias, su paquete vuelve a la cola pasados 30 segundos. Los importes se guardan en céntimos enteros para que las sumas sean exactas.

Lo probé con 16 esclavos a la vez y 480 paquetes: ninguno se repitió y el total coincidió con la suma directa del archivo. Probé también a perder un esclavo y el paquete se recuperó a los 31 segundos. Con 8 esclavos el trabajo pasó de 74 a 31 segundos; no es ocho veces menos porque mi equipo tiene cuatro núcleos.

Es una herramienta pensada para un aula controlada: no tiene contraseñas y usa un solo servidor. Lo siguiente sería una base de datos y una identificación de esclavos. [Cierra con tu agradecimiento.]
