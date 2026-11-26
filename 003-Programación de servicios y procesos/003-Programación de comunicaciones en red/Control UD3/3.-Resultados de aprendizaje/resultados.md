# Resultados de aprendizaje - Programación de comunicaciones en red

**Resultado de aprendizaje 3:** Programa mecanismos de comunicación en red empleando sockets y analizando el escenario de ejecución.

Las rutas de evidencia son relativas a la carpeta de la entrega (`Control UD3`).

Proyecto final: un chat de sala. Un servidor TCP con un hilo por cliente, una pasarela WebSocket y un cliente web, que pueden estar a la vez en la misma sala que los clientes de terminal.

---

### RA 3 - Criterio a
**Pregunta / criterio:** a) Se han identificado escenarios que precisan establecer comunicación en red entre varias aplicaciones.

**Respuesta:** Hacen falta cuando varias aplicaciones comparten información en tiempo real: un chat, un juego multijugador o un lienzo colaborativo, como los ejemplos de clase. Mi proyecto es el primero de ellos: varios clientes (terminal y navegador) que hablan con un mismo servidor.

**Evidencia:** `1.-Ejercicios/007-Utilización de sockets para la transmisión y recepción de información/zelda_multijugador/` y `2.-Proyecto final de unidad/006-cliente web/`

---

### RA 3 - Criterio b
**Pregunta / criterio:** b) Se han identificado los roles de cliente y de servidor y sus funciones asociadas.

**Respuesta:** El servidor espera conexiones (`bind`, `listen`, `accept`), atiende a cada cliente y reparte los mensajes. El cliente se conecta (`connect`), envía y recibe. La pasarela hace los dos papeles: es servidor para el navegador y cliente del servidor de chat.

**Evidencia:** `2.-Proyecto final de unidad/001-servidor de eco/servidor.py`, `2.-Proyecto final de unidad/001-servidor de eco/cliente.py` y `2.-Proyecto final de unidad/005-pasarela websocket/pasarela.py`

---

### RA 3 - Criterio c
**Pregunta / criterio:** c) Se han reconocido librerías y mecanismos del lenguaje de programación que permiten programar aplicaciones en red.

**Respuesta:** Uso `socket` y `threading` de Python para el servidor TCP, `asyncio` y `websockets` para la pasarela, y la clase `WebSocket` de JavaScript en el navegador. En clase vimos también `http.server` y sockets en C.

**Evidencia:** `2.-Proyecto final de unidad/002-varios clientes con hilos/servidor.py`, `2.-Proyecto final de unidad/005-pasarela websocket/pasarela.py` y `2.-Proyecto final de unidad/006-cliente web/web/js/chat.js`

---

### RA 3 - Criterio d
**Pregunta / criterio:** d) Se ha analizado el concepto de socket, sus tipos y características.

**Respuesta:** Un socket es el extremo de una comunicación, identificado por una IP y un puerto. Uso sockets TCP (`SOCK_STREAM`): orientados a conexión y sin pérdida de datos, pero son un flujo de bytes sin límites de mensaje, así que separo los mensajes con saltos de línea. El WebSocket es una conexión permanente y bidireccional para el navegador, que no puede abrir sockets TCP.

**Evidencia:** `1.-Ejercicios/004-Sockets. Tipos. Características/` y `2.-Proyecto final de unidad/001-servidor de eco/servidor.py`

---

### RA 3 - Criterio e
**Pregunta / criterio:** e) Se han utilizado sockets para programar una aplicación cliente que se comunique con un servidor.

**Respuesta:** Tengo dos clientes. El de terminal usa un hilo para recibir mientras el principal lee lo que escribo. El web usa `WebSocket` para conectarse, mostrar los mensajes y enviar los míos.

**Evidencia:** `2.-Proyecto final de unidad/004-registro y errores/cliente.py` y `2.-Proyecto final de unidad/006-cliente web/web/js/chat.js`

---

### RA 3 - Criterio f
**Pregunta / criterio:** f) Se ha desarrollado una aplicación servidor en red y verificado su funcionamiento.

**Respuesta:** El servidor atiende a varios clientes, gestiona apodos y comandos, limita clientes y longitud de mensaje, y anota lo que ocurre en `chat.log`. Lo verifiqué con un script de pruebas: 26 comprobaciones correctas.

**Evidencia:** `2.-Proyecto final de unidad/004-registro y errores/servidor.py` y `2.-Proyecto final de unidad/007-pruebas y mediciones/pruebas/salida-pruebas.txt`

---

### RA 3 - Criterio g
**Pregunta / criterio:** g) Se han desarrollado aplicaciones que utilizan sockets para intercambiar información.

**Respuesta:** Los clientes y el servidor intercambian texto con un protocolo sencillo de una línea por mensaje (`/nick`, `/usuarios`, `/salir`, mensajes de sala). La pasarela traduce ese mismo protocolo entre WebSocket y TCP, así que el navegador y la terminal comparten sala.

**Evidencia:** `2.-Proyecto final de unidad/003-apodos y comandos/servidor.py` y `2.-Proyecto final de unidad/005-pasarela websocket/pasarela.py`

---

### RA 3 - Criterio h
**Pregunta / criterio:** h) Se han utilizado hilos para posibilitar la comunicación simultánea de varios clientes con el servidor.

**Respuesta:** El servidor crea un hilo (`threading.Thread`) por cada cliente, y un `Lock` protege la lista de clientes compartida. En la prueba con 200 clientes a la vez se entregaron 40 000 mensajes en 1,36 s sin perder ninguno.

**Evidencia:** `2.-Proyecto final de unidad/002-varios clientes con hilos/servidor.py` y `2.-Proyecto final de unidad/007-pruebas y mediciones/pruebas/salida-pruebas.txt`

---

### RA 3 - Criterio i
**Pregunta / criterio:** i) Se han caracterizado los modelos de comunicación más usuales en las arquitecturas de aplicaciones distribuidas.

**Respuesta:** Uso el modelo cliente-servidor, con difusión (broadcast) a todos los clientes de la sala. Además, la pasarela actúa de intermediario entre dos protocolos distintos. No he usado un modelo entre iguales (peer to peer).

**Evidencia:** `2.-Proyecto final de unidad/005-pasarela websocket/pasarela.py` y `1.-Ejercicios/005-Creación de sockets/005-servidor grupal.py`

---

### RA 3 - Criterio j
**Pregunta / criterio:** j) Se han depurado y documentado las aplicaciones desarrolladas.

**Respuesta:** Documenté el código con comentarios, el protocolo en la cabecera del servidor y las pruebas en un script que guarda su salida. El registro `chat.log` permite depurar sin guardar el contenido de los mensajes. Las pruebas me sirvieron para encontrar y corregir un fallo de la pasarela: una excepción sin recoger al cerrar el navegador.

**Evidencia:** `2.-Proyecto final de unidad/004-registro y errores/servidor.py` y `2.-Proyecto final de unidad/007-pruebas y mediciones/pruebas/pruebas.py`
