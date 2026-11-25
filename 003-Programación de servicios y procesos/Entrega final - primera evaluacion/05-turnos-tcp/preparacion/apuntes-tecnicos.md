# Apuntes técnicos: Sistema de turnos (TCP multihilo)

## 1. Resumen en 3 líneas
Una sala de espera (clínica, ayuntamiento, taller) sin papeletas: la gente pide turno desde su cliente, los mostradores llaman al siguiente y una pantalla muestra a quién se llama. Un servidor TCP atiende a todos a la vez, con un hilo por cliente y un candado para que dos personas nunca reciban el mismo número. Solo usa la librería estándar de Python.

## 2. Mapa de archivos
| Archivo | Qué hace |
|---|---|
| `servidor.py` | Servidor: reparte turnos, mantiene la cola y avisa a las pantallas. |
| `cliente.py` | Un solo programa con tres modos: `pedir`, `mostrador` y `pantalla`. |

Orden: se arranca `servidor.py`; después los clientes. Los datos viajan como líneas de texto (`PEDIR Ana`, `LLAMAR 1`, `PANTALLA`, `ESTADO`, `SALIR`), y el servidor contesta con otra línea (`TURNO 3 DELANTE 2`, `LLAMANDO 3 Ana`, `VACIO`, `ERROR ...`). Las pantallas, además, reciben avisos cuando alguien llama.

## 3. Fragmentos clave
**A. `servidor.py` líneas 61-65: repartir el turno.** Dentro de `with candado:` se suma uno al contador y se añade la persona a la cola. Sin el candado, dos hilos podrían leer el mismo número a la vez. Concepto: sección crítica y exclusión mutua.

**B. `servidor.py` líneas 97-129 (`atender_cliente`): un cliente.** Lee bytes, los acumula en un búfer y corta por saltos de línea; rechaza líneas de más de 100 bytes y texto que no es UTF-8; cierra a los 300 s sin actividad. Concepto: sockets TCP y protocolo de texto.

**C. `servidor.py` líneas 36-47 (`avisar_pantallas`):** copia la lista de pantallas con el candado y envía fuera de él; si una pantalla se ha caído, la quita. Concepto: sincronización y tolerancia a fallos.

**D. `servidor.py` líneas 139-144: aceptar clientes.** `accept()` espera una conexión y lanza un `Thread` para ella. Concepto: servidor multihilo (un hilo por conexión).

**E. `servidor.py` líneas 50-94 (`tratar_orden`): validar.** Nombre solo con letras y hasta 20, mostrador numérico de 1 o 2 cifras, orden desconocida devuelve error. Concepto: validación de entradas.

## 4. Conceptos de la unidad
Sockets TCP (cliente y servidor); hilos y `threading.Lock`; sincronización; comunicación entre procesos por red; programación segura (validar, limitar tamaño y tiempo). Visto en `003-Programación de comunicaciones en red` (`003-multiservidor.py`, `005-servidorseguro.py`); nada nuevo.

## 5. Decisiones técnicas
- **TCP con un hilo por cliente** frente a asíncrono: el modelo visto en clase; sencillo. Coste: no escala a miles de clientes.
- **Protocolo de texto por líneas:** fácil de probar a mano y de explicar. Coste: sin cifrado ni estructura formal.
- **Un candado para los datos y otro para los avisos:** evita mezclar avisos de varios mostradores.
- **Cola en memoria:** simple y rápida. Coste: si el servidor se reinicia, se pierden los turnos.
- **Sin dependencias:** solo librería estándar.

## 6. Ejecución y datos
```
cd proyecto
python3 servidor.py                  (puerto 5050; otro puerto: python3 servidor.py 5051)
python3 cliente.py pantalla          (una terminal, bien grande)
python3 cliente.py mostrador 1       (Enter para llamar al siguiente)
python3 cliente.py pedir Ana         (cada persona; opcional IP y puerto al final)
```
Datos: solo nombres y números de turno, en memoria. Validación: ver fragmento E; líneas de más de 100 bytes cortan la conexión; 300 s de inactividad cierran. Errores: el cliente avisa si no encuentra el servidor; el servidor contesta `ERROR ...` y sigue.

## 7. Verificación (real, en `preparacion/pruebas/`)
21 comprobaciones con el servidor real, todas correctas (`salida-pruebas.txt`):
- Orden de la cola (primero en llegar, primero en salir), `VACIO`, `ESTADO`, aviso a la pantalla.
- Entradas inválidas: nombre con números, de 21 letras, con `;`, mostrador no numérico, orden desconocida y vacía, bytes que no son texto, línea de 300 bytes: error o corte; los errores no consumen turnos.
- Una pantalla que se cae no tumba al servidor.
- **300 clientes a la vez:** 300 turnos distintos en 0,14 s.
- **4 mostradores llamando a la vez:** cada turno llamado una vez (300 llamadas en 0,03 s), y la pantalla recibió 300 avisos bien formados.
- Cliente real en sus tres modos (`salida-cliente.txt`).
- Fallo real encontrado al ejecutar el cliente: decía "1 personas"; corregido. No se midió con red real ni con más de 300 clientes.

## 8. Limitaciones y mejora
Cualquiera puede llamar desde un mostrador (no hay contraseña); sin cifrado; no guarda datos al reiniciar; un hilo por cliente. Mejora: contraseña para mostradores, guardar la cola en archivo y una pantalla web.

## 9. Chuleta de defensa
1. **¿Por qué un hilo por cliente?** Para atender a todos a la vez sin que uno bloquee a los demás.
2. **¿Para qué el candado?** Sin él, dos hilos podrían repartir el mismo número; con él, 300 clientes simultáneos obtuvieron 300 turnos distintos.
3. **¿Qué pasa si un cliente envía basura o algo enorme?** Se rechaza o se corta la conexión; probado.
4. **¿Y si se cae una pantalla?** Se quita de la lista y el servidor sigue.
5. **¿Qué mejorarías?** Contraseña de mostrador, persistencia y cifrado.

## 10. Glosario
- **Socket:** punto de conexión de red.
- **TCP:** protocolo que garantiza que los datos llegan completos y en orden.
- **Hilo:** tarea que corre a la vez que otras.
- **Lock (candado):** solo un hilo a la vez puede entrar en esa parte.
- **Sección crítica:** código protegido por el candado.
- **Cola (FIFO):** el primero que llega es el primero que sale.
- **Búfer:** zona donde se acumulan los bytes hasta tener una línea completa.
- **Protocolo:** reglas para entenderse (aquí, órdenes de texto).

## 11. Piezas para el post
- **Intro:** esperar sin saber cuándo te toca; papeletas y gritos; una sala con turnos digitales.
- **Para qué sirve:** pedir turno, llamar desde varios mostradores, pantalla en directo; sin instalar nada más.
- **Técnica:** TCP con hilo por cliente; candado en el contador; protocolo de texto; validación y límites.
- **Verificación:** 300 clientes a la vez, 300 turnos distintos; 4 mostradores sin repetir; 21 pruebas; error "1 personas" corregido.
- **Cierre:** sin contraseña ni persistencia; mejora: ambas más cifrado.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
Todos hemos esperado en una sala sin saber cuándo nos tocaba: papeletas que se pierden, nombres que se gritan y gente que se salta la cola. Un sistema de turnos digital resuelve esto, y quise ver cómo se construye por dentro.

Hice uno pequeño: la persona pide su turno, varios mostradores llaman al siguiente y una pantalla muestra en directo a quién se llama y a qué mostrador ir. Funciona en una red local, sin instalar nada más que Python, y la pantalla se actualiza sola.

Técnicamente es un servidor TCP que atiende a cada cliente con un hilo propio. El punto delicado es el contador de turnos: si dos personas piden a la vez, no pueden recibir el mismo número, así que lo protege un candado. Las órdenes son líneas de texto fáciles de probar a mano, y el servidor rechaza nombres raros, órdenes desconocidas y mensajes demasiado largos.

Lo probé con 300 clientes pidiendo turno a la vez: salieron 300 números distintos en 0,14 segundos. También con cuatro mostradores llamando a la vez, sin repetir ningún turno, y con una pantalla que se cae a mitad sin que el servidor se resienta. Al probar el cliente descubrí un error de redacción ("1 personas") y lo corregí.

Tiene límites claros: cualquiera podría llamar desde un mostrador porque no hay contraseña, y si se reinicia el servidor se pierden los turnos. Esas dos mejoras serían lo siguiente, junto con cifrar la conexión. [Cierra con tu agradecimiento.]
