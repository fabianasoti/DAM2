# Apuntes técnicos: Hormiguero (workers)

## 1. Resumen en 3 líneas
Simulación visual de hormigas en un canvas. Cada hormiga "piensa" antes de dar un paso (la carga) y tú eliges cuántas hay, cuánto piensan y cuántos workers se reparten el trabajo. Sirve para ver que el navegador tiene un solo hilo y que los workers lo descargan.

## 2. Mapa de archivos
| Archivo | Qué hace |
|---|---|
| `index.html` | Página: canvas, controles, marcadores y tabla. Carga `hormigas.js` y `principal.js`. |
| `js/hormigas.js` | La lógica de mover hormigas. La usan el hilo principal y los workers (mismo cálculo). |
| `js/trabajador.js` | El worker: recibe su grupo, calcula un fotograma y devuelve las posiciones. |
| `js/principal.js` | Crea hormigas y workers, reparte, espera, dibuja, mide FPS y ejecuta el botón de medir. |
| `css/estilo.css` | Aspecto. |

Orden: el navegador carga `index.html`, luego `hormigas.js` y `principal.js`. `principal.js` llama a `crear()` (línea 285 arranca el bucle). Datos: array grande (4 números por hormiga) en el principal; cada worker recibe una **copia** de su trozo, calcula y devuelve su trozo; el principal lo vuelca en el array grande y dibuja.

## 3. Fragmentos clave
**A. `hormigas.js` líneas 10-40: lo que piensa cada hormiga.** El bucle `for k < carga` hace `Math.sin` muchas veces (carga = cuentas por hormiga). El resultado cambia un poco el giro, así no es trabajo inútil. Concepto: carga de CPU simulada.

**B. `trabajador.js` líneas 9-23: el worker.** Con `onmessage` recibe órdenes. "iniciar": guarda sus hormigas. "calcular": llama a `moverHormigas` y responde con `postMessage`. Concepto: comunicación por mensajes, sin variables compartidas.

**C. `principal.js` líneas 92-109: reparto.** Crea el worker, le manda `todas.slice(...)` (su trozo, copiado) y define qué hacer cuando contesta: `todas.set(...)` guarda sus resultados y `pendientes--`; cuando llega a 0, todos han terminado. Concepto: reparto de datos y sincronización.

**D. `principal.js` líneas 118-137: el bucle.** `requestAnimationFrame` se vuelve a pedir siempre; si `pendientes > 0` salimos (aún hay workers calculando). Sin workers calcula allí mismo. Concepto: concurrencia y espera de todos.

**E. `principal.js` líneas 225-262: botón Medir.** Prueba 0, 1, 2, 4 y 8 workers: 1 s de calentamiento y 3 s midiendo, y apunta FPS y ms. Concepto: monitorización.

## 4. Conceptos de la unidad
Hilos y workers; programación concurrente (varias cosas a la vez) y paralela (varios núcleos a la vez); comunicación por mensajes; sincronización (esperar a todos); monitorización del rendimiento (FPS, ms). **Concepto nuevo:** `importScripts` (línea 3 de `trabajador.js`) carga otro archivo dentro del worker; lo uso para compartir `hormigas.js`.

## 5. Decisiones técnicas
- **Workers del navegador** frente a procesos del sistema o C++: es lo visto y se ve en pantalla. Coste: no comparten memoria, hay que copiar datos.
- **Mismo código en principal y worker** (`hormigas.js`): comparación justa. Coste: `importScripts`.
- **Cada worker conserva su grupo** y solo devuelve posiciones: menos copias por fotograma.
- **Dibujo en 2 trazos** (cuerpos y patas) en vez de uno por hormiga: el dibujo siempre es del hilo principal y no debe tapar la comparación.
- **Fotograma a la velocidad del worker más lento**: más simple que adelantar fotogramas; coste: un worker lento frena a todos.

## 6. Ejecución y datos
- Abrir con un servidor web (Apache): `http://localhost/Github/DAM2/DAM2/003-Programaci%C3%B3n%20de%20servicios%20y%20procesos/Entrega%20final%20-%20primera%20evaluacion/02-hormiguero/proyecto/`. Sin dependencias.
- Datos: hormigas creadas al azar al arrancar; nada se guarda ni se envía fuera.
- Validación: `limitar()` (líneas 44-48) convierte cualquier valor en número y lo mantiene dentro de límites (10-3000 hormigas, 0-20000 carga, 0-8 workers).
- Errores: no hay red ni archivos; el riesgo es abrir sin servidor web (los workers no arrancan; lo he dejado como plan B).

## 7. Verificación (real)
- `node --check` de los tres JS: sin errores.
- Prueba de humo con navegador simulado (`preparacion/mediciones/prueba-humo.js`): sin workers y con 4 funcionan, `99999` hormigas se limita a 3000 y `abc` en carga vuelve a 1000.
- Medición del tiempo de cálculo en Node (`mediciones/salida-node.txt`), equipo de 4 núcleos y 8 hilos. Con 1000 hormigas y carga 5000: **55,5 ms sin workers frente a 22,7 ms con 8** (2,4 veces más rápido). Con carga 0: **0,06 ms frente a 0,36 ms**, los workers empeoran.
- **FPS en el navegador (medido por ti):** 1000 hormigas, carga 5000: de 7,1 FPS sin workers a 17,7 FPS con 8 (2,5 veces); el cálculo baja de 139,3 ms a 49,3 ms.
- Fallos reales al construir: ninguno detectado en estas pruebas.

## 8. Limitaciones y mejora
Los 8 workers no dan 8 veces más: el equipo tiene 4 núcleos físicos, y copiar mensajes cuesta. El dibujo sigue en el hilo principal. Mejora: memoria compartida (`SharedArrayBuffer`) para evitar copias, o `OffscreenCanvas` para dibujar en un worker (no visto en clase).

## 9. Chuleta de defensa
1. **¿Por qué workers?** El navegador solo tiene un hilo para calcular y dibujar; un worker es otro hilo y deja libre al principal.
2. **¿Por qué con carga 0 es peor con workers?** Hay que copiar datos y enviar mensajes; si el trabajo es poco, ese coste pesa más que el cálculo.
3. **¿Por qué 8 workers no es 8 veces más rápido?** Hay 4 núcleos físicos, los mensajes cuestan y el fotograma espera al más lento.
4. **¿Cómo evitas que dos workers pisen la misma hormiga?** Cada uno tiene su copia y no se comparten variables; solo se intercambian mensajes.
5. **¿Cómo sabes que funciona más rápido?** Mido con `performance.now()` (en la página) y con `hrtime` (en Node), con calentamiento y varios fotogramas.

## 10. Glosario
- **Hilo principal:** el que ejecuta tu página y la dibuja.
- **Worker:** hilo aparte que no comparte variables con la página.
- **postMessage:** forma de enviar datos entre página y worker (se copian).
- **FPS:** fotogramas por segundo; si bajan, la animación se ve a saltos.
- **Carga:** cuentas que hace cada hormiga por fotograma.
- **requestAnimationFrame:** pide al navegador el siguiente fotograma.
- **Overhead:** coste extra de repartir y comunicar el trabajo.
- **Calentamiento:** fotogramas iniciales que no se miden.

## 11. Piezas para el post
- **Intro:** una página que se congela con cálculos largos; quién lo sufre (editores de fotos, mapas, paneles con muchos datos); lo vemos con hormigas.
- **Para qué sirve:** ver la diferencia entre 0 y varios workers; sliders de hormigas y carga; usos reales: no bloquear la página.
- **Técnica:** un hilo en el navegador; workers por mensajes; mismo cálculo en ambos; esperar a todos con `pendientes`; dibujo en 2 trazos.
- **Verificación:** 55,5 ms frente a 22,7 ms (1000 hormigas, carga 5000, 8 workers, Node); con carga 0 los workers pierden (0,06 frente a 0,36 ms); límite de 4 núcleos; en tu navegador, de 7,1 a 17,7 FPS con 8 workers.
- **Cierre:** funciona en el navegador sin instalar; no es 8 veces por 8 workers; mejora con memoria compartida.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
Todos hemos visto una página web que se queda congelada mientras "piensa". Quien más lo sufre es quien trabaja con fotos, mapas o muchos datos: el botón no responde y no sabe si ha fallado o está trabajando.

Para entender por qué pasa, hice un hormiguero. Cada hormiga calcula su camino antes de dar un paso, y con unos controles se elige cuántas hormigas hay, cuánto piensan y cuántos workers reparten el trabajo. Al subir la carga se ve cómo todo se frena, y al repartirla se ve cómo vuelve a ir fluido. Sirve para enseñar la idea a cualquiera sin una línea de código.

Técnicamente, el navegador tiene un solo hilo para calcular y dibujar. Los workers son hilos aparte que no comparten variables: se hablan por mensajes. Cada worker recibe su grupo de hormigas, calcula y devuelve las posiciones, y la página espera a que todos terminen antes de dibujar. El mismo código de cálculo se usa con y sin workers para que la comparación sea justa.

Lo medí: con 1000 hormigas y carga alta, un fotograma tardó 55 ms sin workers y 23 ms con 8. Con poca carga, los workers fueron peores (0,06 ms frente a 0,36 ms), porque copiar datos también cuesta. En el navegador pasé de unos 7 fotogramas por segundo a casi 18. Probé también que los controles no admiten valores raros.

Resultado: una herramienta sencilla que enseña cuándo compensa repartir el trabajo y cuándo no. No es ocho veces más rápida con ocho workers: mi equipo tiene cuatro núcleos y los mensajes cuestan. La mejora que haría es compartir memoria para evitar copias. [Cierra con tu agradecimiento.]
