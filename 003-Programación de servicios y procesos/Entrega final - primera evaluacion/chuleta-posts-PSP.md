# Chuleta de posts: Programación de servicios y procesos

4 posts: fotos, hormiguero, reparto de cálculo y chat con IA local. Para cada uno: guion del vídeo, qué debe tener el texto, frases sueltas, cifras, limitación y un ejemplo.

**Ojo:** el profe prohíbe usar IA para limpiar el texto. Los ejemplos son para ver la forma y el tono. No los copies: escribe el tuyo con las frases sueltas.

## Qué pide la rúbrica en todos (4 a 6 párrafos)
| Párrafo | Cuántos | Debe tener |
|---|---|---|
| Introducción | 1 | Una necesidad humana, quién la tiene y qué le cuesta. Sin empezar por tecnologías. |
| Para qué sirve | 1-2 | A quién ayuda, qué mejora, un ejemplo de uso y una cifra comprobable. |
| Técnica | 1-2 | Dos decisiones con su porqué y su coste, cómo lo verificaste y dónde se ejecuta. |
| Cierre | 1 | Volver al problema, qué falta, qué mejorarías y dar las gracias. |

**Frase de la IA (opcional, una sola, en la parte técnica):** "Usé un asistente de IA para escribir y probar código; las decisiones fueron mías y revisé los resultados."

---

# 1. Procesador de fotos

**En una frase:** aplica un filtro a un lote de fotos sin que la página se congele. **Para quién:** quien prepara catálogos o álbumes.

## Vídeo (2 min 30 s)
| Tiempo | Qué se ve | Qué digo |
|---|---|---|
| 0:00-0:20 | Página vacía | Filtrar muchas fotos congela la página. |
| 0:20-0:50 | Elegir las 21 fotos, sepia, "Aplicar" | La barra avanza y el reloj no se para. |
| 0:50-1:20 | Ratón sobre una foto y descargar una | Original frente a filtrada. |
| 1:20-1:50 | "Medir 1, 2, 4 y 8 workers" | Cada worker coge la siguiente foto. |
| 1:50-2:30 | Terminal `~/filtro sepia 100 fotos` | La misma tarea en C++; no escala 8 veces. |

## Frases sueltas
- **Intro:** muchas fotos · la página se queda congelada · no sabes si ha terminado
- **Para qué sirve:** un filtro a todas a la vez · barra de progreso · reloj que sigue · descargar
- **Técnica:** workers · cola de fotos · cada uno coge la siguiente · esperar a todos · C++ con OpenMP como comparación
- **Cierre:** 4 núcleos físicos · dividir cada foto en franjas

**Cifras:** web, 11 660 ms con 1 worker y 3 461 ms con 8 (tu medición) · C++, de 2,2 a 2,8 veces más rápido con 8 hilos.
**Limitación:** con 8 workers no va 8 veces más rápido. **Mejora:** dividir cada foto en franjas.

## Ejemplo (5 párrafos)
Quien prepara un catálogo sabe lo pesado que es aplicar el mismo filtro a decenas de fotos. La página se queda congelada y no sabes si está trabajando o se ha colgado.

Hice un procesador de fotos que permite elegir un lote, escoger un filtro y aplicarlo a todas a la vez. Una barra muestra cuántas van, un reloj sigue corriendo para demostrar que la página responde y al final puedes descargarlas.

El trabajo se reparte entre varios workers, que son hilos aparte del navegador. Las fotos esperan en una cola y cada worker coge la siguiente cuando termina la suya, así ninguno se queda parado. Para comparar, hice la misma tarea en C++ con OpenMP.

En las mediciones con 21 fotos, en el navegador pasó de 11 660 ms con un worker a 3 461 ms con ocho. En C++, ocho hilos fueron entre 2,2 y 2,8 veces más rápidos que uno.

No es ocho veces más rápido porque mi equipo tiene cuatro núcleos físicos. Lo siguiente sería dividir cada foto en franjas. ¡Gracias por leer!

---

# 2. Hormiguero

**En una frase:** hormigas que muestran por qué una página se frena y cómo ayudan los workers. **Para quién:** quien está aprendiendo programación web.

## Vídeo (2 min 30 s)
| Tiempo | Qué se ve | Qué digo |
|---|---|---|
| 0:00-0:20 | Hormigas moviéndose | Por qué se congela una web: lo explico con hormigas. |
| 0:20-0:50 | Subir la carga con 0 workers | Un solo hilo calcula y dibuja; todo se frena. |
| 0:50-1:20 | Poner 4 y 8 workers | El cálculo se reparte y vuelve a ir fluido. |
| 1:20-1:50 | Carga 0 con workers | Con poco trabajo no ayudan: copiar datos cuesta. |
| 1:50-2:30 | Botón "Medir" y la tabla | Resultados y límite de núcleos. |

## Frases sueltas
- **Intro:** una web que se queda pensando · el botón no responde
- **Para qué sirve:** verlo sin leer código · mover controles · cuantas más cuentas, más lentas
- **Técnica:** un solo hilo · workers que se comunican por mensajes · mismo cálculo con y sin workers · esperar a todos
- **Cierre:** no siempre compensa repartir · memoria compartida

**Cifras:** 1000 hormigas con carga 5000, en tu navegador: **de 7 a 18 FPS** con 8 workers · el cálculo baja de 139 a 49 ms · con carga 0, los workers empeoran (medido aparte con Node: 0,06 frente a 0,36 ms).
**Limitación:** el dibujo sigue en el hilo principal. **Mejora:** memoria compartida para no copiar datos.
**Para grabar:** pon 1000 hormigas y carga 5000, como en tu medición.

## Ejemplo (5 párrafos)
Todos hemos visto una página que se queda "pensando": pulsas un botón y no pasa nada. Cuando estás aprendiendo, cuesta entender por qué ocurre.

Para verlo, hice un hormiguero. Cada hormiga calcula su camino antes de dar un paso, y con tres controles decides cuántas hay, cuánto piensan y cuántos workers reparten el trabajo. Si subes la carga, las hormigas se atascan; si repartes, vuelven a moverse.

El navegador usa un mismo hilo para calcular y dibujar. Los workers son hilos aparte que no comparten variables y hablan por mensajes. Cada uno lleva su grupo de hormigas y la página espera a que terminen todos. Usé el mismo cálculo con y sin workers para que la comparación fuera justa.

En mi navegador, con 1000 hormigas y mucha carga, la animación pasó de 7 fotogramas por segundo sin workers a casi 18 con ocho. Con poca carga pasó lo contrario, porque copiar datos también cuesta.

Aprendí que repartir no siempre compensa. Me gustaría probar memoria compartida para evitar las copias. ¡Gracias por leer!

---

# 3. Reparto de cálculo

**En una frase:** varios ordenadores calculan entre todos las ventas de una cadena de papelerías. **Para quién:** un negocio o aula con muchos datos y varios equipos.

## Cómo explicarlo
La dueña de cinco papelerías quiere saber cuánto ingresó cada una. Como repartir exámenes para corregir: montones, cada compañero coge uno y al final se suma.

## Vídeo (2 min 30 s)
| Tiempo | Qué se ve | Qué digo |
|---|---|---|
| 0:00-0:20 | Maestro | Como corregir exámenes entre varios. |
| 0:20-0:40 | 2 o 3 ventanas de esclavo | Cada navegador es un ayudante. |
| 0:40-1:00 | "Preparar trabajo" | Los paquetes van a las mesas; candado al cogerlos. |
| 1:00-1:20 | Cerrar un esclavo | Mesa en rojo; a los 30 s otro coge su paquete. |
| 1:20-2:00 | Barras y "Comprobado" | La suma coincide con la del archivo. |
| 2:00-2:30 | `php/trabajo.php` | `flock`: nadie coge el mismo paquete. |

Carga 30 000 000, ventanas visibles y "Reiniciar" antes de grabar.

## Frases sueltas
- **Intro:** muchas ventas · un solo ordenador ocupado
- **Para qué sirve:** ingresos por tienda · producto más vendido · se ve quién tiene cada paquete
- **Técnica:** maestro y esclavos · cola en un archivo · candado `flock` · reasignar a los 30 s · céntimos enteros
- **Cierre:** un solo servidor · sin contraseña · base de datos

**Cifras:** 16 esclavos y 480 paquetes sin ninguno repetido · de 74 s con 1 esclavo a 31 s con 8.
**Limitación:** sin contraseña y con un solo servidor; la carga es artificial. **Mejora:** base de datos e identificar a los esclavos.

## Ejemplo (5 párrafos)
Imagina que tienes cinco papelerías y quieres saber cuánto ha ingresado cada una este mes. Con pocos datos es fácil, pero cuando crecen, un solo ordenador se queda ocupado mucho rato.

Mi aplicación lo reparte como quien corrige exámenes entre compañeros. Un ordenador hace montones de ventas y los demás van cogiendo uno, lo calculan y lo devuelven. En pantalla se ve cada paquete pasar del montón a una mesa y de la mesa a terminados.

Lo delicado es que dos no cojan el mismo paquete, así que un candado de archivo deja pasar a uno cada vez. Si alguien cierra su ventana a medias, a los 30 segundos su paquete se le da a otro. Para sumar sin errores, el dinero se guarda en céntimos.

En las pruebas, con 16 esclavos y 480 paquetes, ninguno se repitió y el total coincidió con el del archivo. Con ocho esclavos el trabajo bajó de 74 a 31 segundos. La carga es simulada, porque 2400 ventas se suman al instante.

Está pensado para un aula: no tiene contraseñas y usa un solo servidor. Lo siguiente sería una base de datos. ¡Gracias por leer!

---

# 4. Chat con IA local

**En una frase:** un chat cuyas respuestas calcula una IA en la propia red. **Para quién:** un aula u oficina que no quiere enviar sus preguntas fuera.

## Vídeo (2 min 30 s)
| Tiempo | Qué se ve | Qué digo |
|---|---|---|
| 0:00-0:20 | Pantalla de entrada | Usar IA sin que las preguntas salgan de la red. |
| 0:20-0:40 | Clave mala y luego la buena | Se entra con la clave del aula. |
| 0:40-1:30 | Pregunta y respuesta | Responde Ollama en este equipo; se ve el tiempo. |
| 1:30-2:00 | Segunda IA o segunda ventana | El servidor reparte las preguntas. |
| 2:00-2:30 | Parar la IA y preguntar | Avisa si no hay IA. Límites. |

Haz una pregunta de calentamiento antes de grabar y comprueba que el puerto 8765 está libre.

## Frases sueltas
- **Intro:** preguntas internas · no quiero enviarlas a un servicio externo
- **Para qué sirve:** chat web · aviso de IAs conectadas · quién respondió y cuánto tardó
- **Técnica:** WebSocket · servidor que reparte · IAs como programas aparte · Ollama · clave por rol · límites
- **Cierre:** sin cifrado ni historial · `wss` y cuentas

**Cifras:** con `gemma3:4b`, respuestas de 2 a 9,5 s (3 preguntas) · 15 pruebas del servidor.
**Limitación:** la conexión no va cifrada. **Mejora:** `wss` y una cuenta por usuario.

## Ejemplo (5 párrafos)
Muchas personas usan asistentes de IA, pero no todo se puede escribir en ellos: apuntes, datos de clientes o dudas internas. Enviarlo fuera no siempre es buena idea.

Por eso hice un chat de aula en el que contesta una IA que funciona en un ordenador de la misma red. Entras con tu nombre y una clave, preguntas, y la respuesta indica qué IA contestó y cuánto tardó.

Un servidor WebSocket mantiene las conexiones abiertas y reparte cada pregunta a la IA con menos trabajo. Cada IA es un programa aparte que usa Ollama, así que se pueden añadir más. Hay una clave distinta para usuarios y para IAs, y límites para no saturar el sistema.

Pasó quince pruebas, como claves incorrectas o una IA que se cae con una pregunta pendiente. Con el modelo real, las respuestas tardaron entre 2 y 10 segundos en mi equipo.

Todavía no cifra la conexión ni guarda historial. Lo siguiente sería cifrarla y dar una cuenta a cada persona. ¡Gracias por leer!
