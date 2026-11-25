# Apuntes técnicos: Procesador de fotos (workers y C++/OpenMP)

## 1. Resumen en 3 líneas
Una página web para aplicar un filtro (grises, sepia, negativo o más brillo) a un lote de fotos sin que la página se congele: el trabajo se reparte entre varios workers con una cola. Un reloj en pantalla sigue avanzando mientras se procesa y un botón mide 1, 2, 4 y 8 workers. Hay además una versión en C++ con OpenMP que hace lo mismo por línea de comandos.

## 2. Mapa de archivos
| Archivo | Qué hace |
|---|---|
| `index.html` | Controles, reloj, barra de progreso, galería y tabla de medición. |
| `js/principal.js` | Carga las fotos, reparte la cola entre workers, pinta resultados, mide y descarga. |
| `js/trabajador.js` | Worker: filtra una foto y la devuelve. |
| `js/filtros.js` | Los cuatro filtros; los usa el worker (no toca la página). |
| `cpp/filtro.cpp` | Versión de línea de comandos en C++ con OpenMP y OpenCV. |
| `css/estilo.css`, `fotos/` | Aspecto y 21 fotos de ejemplo (ilustraciones). |

Orden: el usuario elige fotos (`principal.js` línea 70), cada una se dibuja en un canvas; al pulsar "Aplicar" se crean N workers y cada uno recibe una foto; cuando devuelve la suya, coge la siguiente de la cola.

## 3. Fragmentos clave
**A. `principal.js` líneas 152-178 (`enviarSiguiente`).** Saca la primera foto de la cola, lee sus píxeles del canvas y se los manda al worker con `postMessage`, transfiriendo la memoria en vez de copiarla. Concepto: reparto de trabajo con cola.

**B. `trabajador.js` líneas 6-28.** Recibe los píxeles, aplica el filtro tantas veces como "repeticiones", siempre desde la original, y devuelve el resultado. Concepto: worker y mensajes.

**C. `principal.js` líneas 184-206 (`recibirResultado`).** Pinta la foto filtrada, avanza la barra y da otra foto al mismo worker. Así ningún worker espera mientras queden fotos (cola dinámica). Concepto: planificación y balanceo.

**D. `principal.js` líneas 222-277 (`procesarFotos`).** Crea una promesa por foto y `Promise.all` avisa cuando todas han terminado; solo entonces se para el cronómetro y se cierran los workers. Concepto: sincronización (esperar a todos).

**E. `cpp/filtro.cpp` líneas 174-180.** `#pragma omp parallel for ... schedule(dynamic)` reparte las fotos entre hilos; cada hilo coge la siguiente cuando acaba. Concepto: paralelismo con OpenMP, la misma idea que la cola.

## 4. Conceptos de la unidad
Hilos y workers; programación concurrente y paralela; cola de trabajo y balanceo dinámico; sincronización con promesas; monitorización (reloj de prueba, tiempos, mejora y eficiencia); OpenMP. Visto en `003-Hilos`, `004-Programación concurrente`, `005`, `007-Gestión de procesos`. **Para repasar** (los usaste tú y conviene saber explicarlos): `Promise.all`, la "transferencia" de memoria al worker y la expresión regular de la línea 422 que quita la extensión del nombre.

## 5. Decisiones técnicas
- **Cola dinámica** frente a repartir las fotos por adelantado: si una foto tarda más, el resto de workers no se quedan parados. Coste: más mensajes.
- **Workers** frente a procesar en el hilo principal: la página no se congela (el reloj de la línea 59 lo demuestra).
- **Transferir memoria** frente a copiar: más rápido; la foto original se vuelve a leer del canvas.
- **C++ con OpenMP** como contraste: el mismo reparto con una sola línea (`pragma`). Coste: hay que compilarlo y no tiene interfaz.
- **Repeticiones configurables** (1 a 1000): sin ellas, con 21 fotos pequeñas no habría trabajo suficiente para ver diferencias.

## 6. Ejecución y datos
- Web: abrir con servidor web (no con doble clic, los workers no arrancan): `http://localhost/Github/DAM2/DAM2/003-Programaci%C3%B3n%20de%20servicios%20y%20procesos/Entrega%20final%20-%20primera%20evaluacion/01-procesador-fotos/proyecto/`. Sin dependencias.
- C++: `sudo apt install libopencv-dev pkg-config`; compilar `g++ -O2 -fopenmp cpp/filtro.cpp -o ~/filtro $(pkg-config --cflags --libs opencv4)`; ejecutar `~/filtro sepia 100 fotos`. El binario no se guarda en el proyecto.
- Datos: fotos locales; nada sale del navegador ni se guarda.
- Validación: repeticiones limitadas a 1-1000 (línea 284); si fallan los workers se avisa de que hay que abrir desde localhost (línea 268); el programa C++ comprueba los argumentos, que el filtro exista, que la carpeta exista y que haya fotos legibles.

## 7. Verificación
- Sintaxis de los tres JS correcta (`node --check`).
- **C++ medido por mí** (`mediciones/salida-cpp.txt`): 21 fotos, filtro sepia, 100 repeticiones. 1 hilo: 5768 ms; 8 hilos: 2031 ms (2,84×). Otras ejecuciones: entre 2,22× y 2,84× con 8 hilos; la ejecución varía.
- **Casos de error del C++** probados: filtro inexistente y carpeta inexistente dan un mensaje claro.
- **Web medida por ti** (tu `resultados.md`, 21 fotos, 200 repeticiones): 11 660 ms con 1 worker y 3 461 ms con 8 (3,37×). No lo he repetido yo (no hay navegador aquí).
- Fallos reales corregidos: no tengo registro verificable de los que encontraste; cuéntamelos para la ficha.

## 8. Limitaciones y mejora
8 workers no dan 8 veces más: el equipo tiene 4 núcleos físicos. Las fotos se procesan enteras (no por trozos). Mejora: dividir cada foto en franjas y usar memoria compartida.

## 9. Chuleta de defensa
1. **¿Por qué workers?** Para que la página no se congele mientras se filtran las fotos.
2. **¿Cómo repartes el trabajo?** Una cola: cada worker coge la siguiente foto al terminar la suya.
3. **¿Cómo sabes que acabaron todos?** `Promise.all` espera a que se cumplan las promesas de todas las fotos.
4. **¿Por qué no es 8 veces más rápido con 8?** 4 núcleos físicos y coste de mensajes; en C++ salió entre 2,2 y 2,8 veces.
5. **¿Qué aporta la versión en C++?** Comparar: OpenMP reparte con una línea y el tiempo base es mucho menor.

## 10. Glosario
- **Worker:** hilo aparte del navegador.
- **Cola:** lista de fotos pendientes.
- **Balanceo dinámico:** quien termina coge más trabajo.
- **Promesa:** valor que se cumplirá más tarde.
- **OpenMP:** librería de C++ para repartir bucles entre hilos.
- **Mejora y eficiencia:** tiempo con 1 dividido por tiempo con N; y mejora dividida por N.
- **Transferible:** memoria que se pasa al worker sin copiarla.
- **Reloj de prueba:** si se para, la página está congelada.

## 11. Piezas para el post
- **Intro:** procesar muchas fotos congela la página; quien prepara catálogos o álbumes (hipótesis).
- **Para qué sirve:** elegir fotos, un filtro, barra de progreso, descargar; el reloj no se para.
- **Técnica:** workers con cola dinámica; `Promise.all`; transferir memoria; versión C++ con OpenMP.
- **Verificación:** web 11 660 ms frente a 3 461 ms (tu medición); C++ 5768 frente a 2031 ms; 4 núcleos físicos.
- **Cierre:** no escala sin límite; mejora: dividir fotos en franjas.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
Quien prepara un catálogo o un álbum sabe lo que es aplicar el mismo filtro a decenas de fotos: la página se queda congelada y no se sabe si va a acabar. Quise resolver ese bloqueo con una herramienta sencilla que se pueda usar en el navegador.

El procesador de fotos permite elegir un lote, escoger un filtro (grises, sepia, negativo o más brillo) y aplicarlo a todas a la vez. Una barra de progreso muestra cuántas van, hay un reloj que sigue corriendo para demostrar que la página no se bloquea, y al final se pueden descargar las fotos filtradas.

El trabajo se reparte entre varios workers, que son hilos aparte del navegador. Las fotos esperan en una cola y cada worker coge la siguiente cuando termina la suya, de modo que ninguno se queda parado. La página espera a que todas las promesas se cumplan antes de dar el trabajo por acabado. Para comparar, hice la misma tarea en C++ con OpenMP, donde el reparto cabe en una línea.

Lo medí: en el navegador, con 21 fotos y 200 repeticiones, el tiempo bajó de 11 660 ms con un worker a 3 461 ms con ocho. En C++ comprobé que ocho hilos son entre 2,2 y 2,8 veces más rápidos que uno, y que los casos erróneos, como un filtro inexistente, dan un mensaje claro.

No es ocho veces más rápido con ocho workers porque mi equipo tiene cuatro núcleos físicos. Lo siguiente sería dividir cada foto en franjas para aprovechar mejor los núcleos. [Cierra con tu agradecimiento.]
