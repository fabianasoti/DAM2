# Ficha: Procesador de fotos (workers y C++/OpenMP)

## Problema y para quién (hipótesis, tú confirmas)
- Problema: aplicar un mismo filtro a muchas fotos bloquea la página y no se sabe si va a terminar.
- Quién lo sufre (hipótesis): quien prepara catálogos, álbumes o fotos de un inmueble o una tienda.
- Aplicación real: editores de imagen en el navegador y preparación de lotes de fotos.
- **Confirma tú:** este escenario u otro.

## Decisiones técnicas y alternativas descartadas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Workers del navegador | Procesar en el hilo principal | La página no se congela (el reloj sigue). |
| Cola dinámica | Reparto fijo por adelantado | Ningún worker queda parado si una foto tarda más. |
| Transferir memoria | Copiar los píxeles | Más rápido. |
| Repeticiones configurables | Una sola pasada | Con pocas fotos no habría trabajo suficiente para medir. |
| Versión C++ con OpenMP | Solo JavaScript | Contraste: mismo reparto con una línea. |
| Filtros en `filtros.js` aparte | Dentro del worker | Se pueden reutilizar y probar. |

## Mediciones
**Hechas por mí (C++)**, archivo `mediciones/salida-cpp.txt`, i7-1185G7 (4 núcleos y 8 hilos), g++ 13, OpenCV 4.6.0. Comando (desde `proyecto/`): `~/filtro sepia 100 fotos`. Filtro sepia, 21 fotos, 100 repeticiones (tres ejecuciones, ms):
| Hilos | Ejec. 1 | Ejec. 2 | Ejec. 3 |
|---|---|---|---|
| 1 | 5768 | 6084 | 6108 |
| 2 | 3391 | 3841 | 4110 |
| 4 | 2255 | 2822 | 2884 |
| 8 | 2031 | 2737 | 2413 |
Con 8 hilos la mejora fue de 2,22× a 2,84×. También: grises 2436 a 1070 ms; negativo 976 a 454 ms.

**Hechas por ti (web)**, copiadas de tu `resultados.md`, no repetidas por mí: 21 fotos, 200 repeticiones, 11 660 ms con 1 worker, 3 461 ms con 8 (3,37×); C++ 1 819 ms a 729 ms con 8 hilos (2,49×).
**Pendiente (si quieres datos actuales para el texto):** repite en el navegador con "Medir": ______.

## Pruebas ejecutadas
- `node --check` de `principal.js`, `trabajador.js` y `filtros.js`: sin errores.
- C++: compilación con `-fopenmp` y OpenCV, ejecución con tres filtros, y casos de error (filtro inexistente, carpeta inexistente): mensaje claro.
- No probado por mí: la página en navegador (no hay navegador en este equipo).

## Fallos reales al construir y su corrección
No tengo un registro verificable. **Cuéntame los que recuerdes** (por ejemplo, abrir sin localhost o problemas con las promesas) para anotarlos con honestidad.

## Limitaciones
Fotos enteras (no por trozos); 8 workers no dan 8 veces más (4 núcleos físicos); la medición en el navegador depende de la pestaña y del equipo; el binario C++ se compila a mano.

## Siguiente mejora
Dividir cada foto en franjas y compartir memoria; guardar las fotos filtradas desde C++ con un solo comando.

## Evidencia por competencia
| Competencia | Evidencia | ¿Hay? |
|---|---|---|
| 1 Arquitectura | Workers, cola, alternativas, versión C++ | Sí |
| 2 Orquestación de IA | Depende de cómo lo cuentes | A decidir por ti |
| 3 Seguridad y verificación | Límite de repeticiones, aviso si fallan los workers, errores del C++, mediciones | Parcial |
| 4 Ingeniería de datos | No hay datos persistentes | **No** |
| 5 Infraestructura | Servidor web local, compilación del C++ | Parcial |
| 6 Lógica de negocio | Lotes de fotos | Sí (hipótesis) |
| 7 Comunicación | Vídeo y texto | Sí |
