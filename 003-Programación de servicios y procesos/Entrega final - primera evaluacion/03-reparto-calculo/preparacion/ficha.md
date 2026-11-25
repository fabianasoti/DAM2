# Ficha: Reparto de cálculo entre ordenadores

## Problema y para quién (hipótesis, tú confirmas)
- Problema: analizar muchos datos en un solo ordenador es lento y lo deja ocupado; si hay varios equipos disponibles, se puede repartir.
- Quién lo sufre (hipótesis): una pyme o un aula con varios ordenadores y un archivo grande de ventas.
- Aplicación real: es la idea de proyectos de computación voluntaria y de los sistemas que reparten trabajos por una cola.
- **Confirma tú:** el escenario de las papelerías (ficticio) o el que prefieras.

## Decisiones técnicas y alternativas descartadas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Cola en JSON con `flock` | Base de datos | Es lo visto en clase y suficiente para un aula. |
| Cola en carpeta temporal | Carpeta del proyecto | No hace falta cambiar permisos. |
| Importes en céntimos enteros | Euros con decimales | Sumas exactas y comparación exacta. |
| Paquete perdido a los 30 s | Esperar indefinidamente | Un esclavo caído no bloquea el trabajo. |
| Comprobar contra suma directa | Fiarse del reparto | Detecta paquetes perdidos o duplicados. |
| Carga artificial | Solo los datos | 2400 filas tardan milisegundos; sin carga no se vería el reparto. Es artificial y lo digo. |

## Mediciones (reales)
Archivos en `pruebas/`. Servidor: `PHP_CLI_SERVER_WORKERS=8 php -S 127.0.0.1:8083 -t ../../proyecto`. Equipo: i7-1185G7, 4 núcleos y 8 hilos, Node 22, PHP 8.3.

Tiempo total (`salida-velocidad.txt`; comando `node pruebas.js velocidad`; 60 paquetes de 40 ventas, carga 10 000 000):
| Esclavos | 1 | 2 | 4 | 8 |
|---|---|---|---|---|
| Segundos | 74,39 | 49,76 | 35,93 | 30,86 |

Los esclavos son procesos Node que usan el mismo `trabajador.js`; no son navegadores. **Pendiente (lo mides tú):** tiempo con 1, 3 y más ventanas de navegador: ______.

## Pruebas ejecutadas
- `php -l` sobre los 6 PHP y `node --check` sobre los JS: sin errores.
- `node pruebas.js concurrencia` (`salida-concurrencia.txt`): 16 esclavos, 480 paquetes, 480 distintos, coincide.
- `node pruebas.js negativas` (`salida-negativas.txt`): entradas inválidas rechazadas, límites aplicados, reinicio.
- `node pruebas.js perdido` (`salida-perdido.txt`): paquete recuperado a los 31 s; entrega tardía rechazada.
- `node prueba-pagina.js` (`salida-pagina.txt`): página maestro y esclavo con navegador simulado.
- A través de Apache: `preparar.php`, `estado.php` y `reiniciar.php` responden.
- No probado: varios ordenadores reales ni navegador real.

## Fallos reales al construir y su corrección
Ninguno detectado en las pruebas.

## Limitaciones
Un solo servidor; sin autenticación; cola en archivo (no escala); con 4 núcleos el beneficio se queda en unas 2,4 veces; la medición usa procesos Node, no navegadores.

## Siguiente mejora
Base de datos para la cola y esclavos autenticados.

## Evidencia por competencia
| Competencia | Evidencia | ¿Hay? |
|---|---|---|
| 1 Arquitectura | Maestro/esclavo, cola, alternativas y costes | Sí |
| 2 Orquestación de IA | Depende de cómo lo cuentes | A decidir por ti |
| 3 Seguridad y verificación | Validación de entradas, pruebas de concurrencia, de fallo y comprobación de totales; falta autenticación | Sí (con límite) |
| 4 Ingeniería de datos | CSV y cola con estados, enteros en céntimos, integridad por comprobación; sin base de datos | Parcial |
| 5 Infraestructura | Apache y PHP, cola en carpeta temporal; no probado en red real | Parcial |
| 6 Lógica de negocio | Ingresos por tienda y producto más vendido | Sí (hipótesis) |
| 7 Comunicación | Vídeo y texto | Sí |
