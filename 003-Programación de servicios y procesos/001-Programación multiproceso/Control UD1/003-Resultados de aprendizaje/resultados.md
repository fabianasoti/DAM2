# Resultados de aprendizaje - Programación multiproceso

**Resultado de aprendizaje:** Desarrolla aplicaciones compuestas por varios procesos reconociendo y aplicando principios de programación paralela.

Las rutas de evidencia son relativas a la carpeta de la entrega (`Control UD1`).

Proyecto final: un procesador de fotos por lotes que reparte el trabajo entre varios workers (JavaScript) y una versión en C++ con OpenMP.

---

### RA 1 - Criterio a
**Pregunta / criterio:** a) Se han reconocido las características de la programación concurrente y sus ámbitos de aplicación.

**Respuesta:** La programación concurrente permite que varias tareas avancen a la vez. En clase lo vi con los "bichitos": primero un solo hilo y después varios workers moviéndolos a la vez. Un ámbito de aplicación es el que he usado en el proyecto: procesar muchas fotos a la vez sin que la página se quede congelada.

**Evidencia:** `1.-Ejercicios/004-Programación concurrente/009-array de workers.html` y `2.-Proyecto final de unidad/004-agrego varios workers/`

---

### RA 1 - Criterio b
**Pregunta / criterio:** b) Se han identificado las diferencias entre programación paralela y programación distribuida, sus ventajas e inconvenientes.

**Respuesta:** En la paralela, varios hilos usan los núcleos de un mismo equipo; en la distribuida, varios equipos se reparten el trabajo y se comunican por red. La paralela es más simple, pero no escala sin límite: con 8 workers mi proyecto solo llega a 3,37×. La distribuida (maestro y esclavos con PHP) supera el límite de un equipo, pero necesita un servidor y comunicación por HTTP.

**Evidencia:** `1.-Ejercicios/005-Programación paralela y distribuida/001-definiciones.md`, `1.-Ejercicios/005-Programación paralela y distribuida/009-maestro_esclavos_pesado/` y `2.-Proyecto final de unidad/006-agrego mediciones/`

---

### RA 1 - Criterio c
**Pregunta / criterio:** c) Se han analizado las características de los procesos y de su ejecución por el sistema operativo.

**Respuesta:** En `petamos un nucleo` comprobé que un bucle pesado ocupa un núcleo entero. Al medir mi proyecto vi que el sistema operativo reparte los workers entre los núcleos disponibles. Mi procesador tiene 4 núcleos físicos y 8 hilos, y creo que por eso con 8 workers no se llega a 8×.

**Evidencia:** `1.-Ejercicios/001-Ejecutables. Procesos. Servicios/002-petamos un nucleo.html` y `2.-Proyecto final de unidad/006-agrego mediciones/`

---

### RA 1 - Criterio d
**Pregunta / criterio:** d) Se han caracterizado los hilos de ejecución y descrito su relación con los procesos.

**Respuesta:** Un hilo es una línea de ejecución que vive dentro de un proceso. Cada worker es un hilo aparte de la página, con su propia memoria, y se comunica con ella solo por mensajes. Gracias a eso, la página sigue respondiendo mientras el worker filtra.

**Evidencia:** `1.-Ejercicios/003-Hilos/` y `2.-Proyecto final de unidad/003-agrego un worker/js/trabajador.js`

---

### RA 1 - Criterio e
**Pregunta / criterio:** e) Se han utilizado clases para programar aplicaciones que crean subprocesos.

**Respuesta:** Creo los hilos con la clase `Worker` en JavaScript (`new Worker("js/trabajador.js")`) y con OpenMP en C++ (`#pragma omp parallel for`). Son hilos de ejecución, no procesos nuevos del sistema operativo.

**Evidencia:** `2.-Proyecto final de unidad/004-agrego varios workers/js/principal.js` y `2.-Proyecto final de unidad/008-version en C++ por linea de comandos/cpp/filtro.cpp`

---

### RA 1 - Criterio f
**Pregunta / criterio:** f) Se han utilizado mecanismos para compartir información con los subprocesos iniciados.

**Respuesta:** La página envía a cada worker la foto, el filtro y las repeticiones con `postMessage`. Paso la memoria de los píxeles por transferencia (sin copiarla) para que sea más rápido. En C++ los hilos comparten los vectores de fotos originales y resultados.

**Evidencia:** `2.-Proyecto final de unidad/003-agrego un worker/js/principal.js`, `2.-Proyecto final de unidad/003-agrego un worker/js/trabajador.js` y `2.-Proyecto final de unidad/008-version en C++ por linea de comandos/cpp/filtro.cpp`

---

### RA 1 - Criterio g
**Pregunta / criterio:** g) Se han utilizado mecanismos para sincronizar y obtener el valor devuelto por los subprocesos iniciados.

**Respuesta:** Cada worker devuelve la foto filtrada con `postMessage` y la página la recibe en `onmessage`. Para esperar a que terminen todos uso una promesa por foto y `Promise.all`. La función `procesarFotos` devuelve el tiempo total, que uso para la tabla de mediciones.

**Evidencia:** `2.-Proyecto final de unidad/005-agrego progreso y espera/js/principal.js` y `2.-Proyecto final de unidad/006-agrego mediciones/js/principal.js`

---

### RA 1 - Criterio h
**Pregunta / criterio:** h) Se han desarrollado aplicaciones que gestionen y utilicen procesos para la ejecución de varias tareas en paralelo.

**Respuesta:** El proyecto reparte las fotos entre 1, 2, 4 u 8 workers con una cola: cada worker coge la siguiente foto cuando acaba la suya. Con 21 fotos y 200 repeticiones, en la web pasé de 11 660 ms con 1 worker a 3 461 ms con 8 (3,37×). La versión en C++ pasó de 1 819 ms a 729 ms con 8 hilos (2,49×).

**Evidencia:** `2.-Proyecto final de unidad/004-agrego varios workers/` y `2.-Proyecto final de unidad/008-version en C++ por linea de comandos/cpp/filtro.cpp`

---

### RA 1 - Criterio i
**Pregunta / criterio:** i) Se han depurado y documentado las aplicaciones desarrolladas.

**Respuesta:** Probé cada incremental antes de pasar al siguiente y comenté el código en español. Añadí mensajes de error, por ejemplo cuando no se pueden crear los workers. Documenté el rendimiento con la tabla de mediciones, que se puede copiar en Markdown.

**Evidencia:** `2.-Proyecto final de unidad/006-agrego mediciones/js/principal.js` y `2.-Proyecto final de unidad/007-agrego descarga y pulido/js/principal.js`
