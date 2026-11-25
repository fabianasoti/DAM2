# Ficha: Sistema de turnos (TCP multihilo)

## Problema y para quién (hipótesis, tú confirmas)
- Problema: en una sala de espera sin sistema de turnos se pierden papeletas, hay colas desordenadas y la gente no sabe cuándo le toca.
- Quién lo sufre (hipótesis): clínicas, ayuntamientos, talleres o centros de estudios pequeños.
- Aplicación real: sistemas de turnos de oficinas y servicios de atención.
- **Confirma tú:** este escenario u otro.

## Decisiones técnicas y alternativas descartadas
| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| TCP con hilo por cliente | `asyncio` | Es el modelo de `003-multiservidor.py`; más fácil de explicar. |
| Protocolo de texto por líneas | JSON | Se prueba a mano y se explica fácil. |
| Candado para el contador | Sin candado | Evita turnos repetidos. |
| Candado extra para avisos | Un solo candado | Los avisos de varios mostradores no se mezclan. |
| Cola en memoria | Archivo o base de datos | Rapidez y sencillez; se pierde al reiniciar. |
| `isalpha`/`isdecimal` para validar | Expresiones regulares | No se han visto en clase. |

## Mediciones (reales)
`pruebas/salida-pruebas.txt`, comando `python3 pruebas.py`. Equipo: i7-1185G7, 4 núcleos y 8 hilos, Python 3.12.3.
- 300 clientes simultáneos piden turno: 300 turnos distintos en **0,14 s**.
- 4 mostradores llaman a la vez: 300 llamadas, cada una una sola vez, en **0,03 s**.
- La pantalla recibe 300 avisos bien formados.
Son pruebas en el mismo equipo (`127.0.0.1`), no en una red real.

## Pruebas ejecutadas
- `py_compile` de los dos archivos.
- `python3 pruebas.py`: 21 comprobaciones, todas correctas (`salida-pruebas.txt`).
- Cliente real en sus tres modos (`salida-cliente.txt`).
- **No probado:** otros ordenadores, más de 300 clientes, cortes de red reales.

## Fallos reales al construir y su corrección
- Al ejecutar el cliente salía "Hay 1 personas delante": corregido con singular y plural.
- Dos detalles de concurrencia detectados al releer el código (no observados al ejecutar): la pantalla debía recibir `PANTALLA_OK` antes de apuntarse a los avisos y los avisos debían enviarse de uno en uno. Corregidos antes de probar.
- Sustituí las expresiones regulares por `isalpha` e `isdecimal` y repetí las 21 pruebas.

## Limitaciones
Sin contraseña de mostrador; sin cifrado; sin persistencia; un hilo por cliente; una pantalla bloqueada podría retrasar los avisos hasta su tiempo de espera.

## Siguiente mejora
Contraseña para mostradores, guardar la cola en archivo y pantalla web.

## Evidencia por competencia
| Competencia | Evidencia | ¿Hay? |
|---|---|---|
| 1 Arquitectura | Servidor y clientes, hilo por cliente, alternativas y costes | Sí |
| 2 Orquestación de IA | La aplicación no usa IA; solo cómo la desarrollaste | **No** (salvo que lo cuentes de tu proceso) |
| 3 Seguridad y verificación | Validación, límites, 21 pruebas; falta autenticación y cifrado | Sí (con límite) |
| 4 Ingeniería de datos | Cola en memoria; sin datos persistentes | **No** |
| 5 Infraestructura | Solo Python; puertos; no probado en red real | Parcial |
| 6 Lógica de negocio | Turnos en salas de espera | Sí (hipótesis) |
| 7 Comunicación | Vídeo y texto | Sí |
