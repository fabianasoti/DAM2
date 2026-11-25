# Servidor del chat con IA local
# Los usuarios (navegadores) hacen preguntas y el servidor las reparte entre las IAs conectadas.
# Cada IA es un programa aparte (ia.py) que habla con Ollama en su ordenador.
import asyncio
import json
import hmac
import os
import time
from collections import deque

import websockets

# ---------- Configuración ----------
carpeta = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(carpeta, "configuracion.json"), encoding="utf-8") as archivo:
    config = json.load(archivo)

PUERTO = config["puerto"]
MAX_TEXTO = 500            # caracteres máximos por pregunta
MAX_PREGUNTAS = 10         # preguntas permitidas por usuario...
VENTANA = 60               # ...en esta cantidad de segundos
TIEMPO_PRESENTACION = 10   # segundos para identificarse al conectar

# ---------- Estado (solo en memoria: no se guarda ningún mensaje) ----------
usuarios = {}   # conexión -> nombre
ias = {}        # conexión -> nombre
trabajos = {}   # id de pregunta -> {"usuario": conexión, "ia": conexión, "inicio": instante}
historial = {}  # conexión del usuario -> instantes de sus últimas preguntas
siguiente_id = 1


async def enviar(conexion, mensaje):
    # Envía un mensaje; si la conexión ya se cerró, no pasa nada
    try:
        await conexion.send(json.dumps(mensaje, ensure_ascii=False))
    except websockets.exceptions.ConnectionClosed:
        pass


async def avisar_estado():
    # Dice a todos los usuarios cuántas IAs hay conectadas
    for usuario in list(usuarios):
        await enviar(usuario, {"tipo": "estado", "ias": len(ias)})


def clave_correcta(recibida, esperada):
    # Compara sin dar pistas por el tiempo que tarda
    if not isinstance(recibida, str):
        return False
    return hmac.compare_digest(recibida.encode(), esperada.encode())


def pendientes_de(ia):
    # Cuántas preguntas tiene ahora esta IA sin contestar
    return sum(1 for t in trabajos.values() if t["ia"] is ia)


def dentro_del_limite(usuario):
    # Limita cuántas preguntas por minuto puede hacer cada usuario
    ahora = time.monotonic()
    momentos = historial.setdefault(usuario, deque())
    while momentos and ahora - momentos[0] > VENTANA:
        momentos.popleft()
    if len(momentos) >= MAX_PREGUNTAS:
        return False
    momentos.append(ahora)
    return True


async def tratar_pregunta(usuario, datos):
    global siguiente_id
    texto = datos.get("texto")

    if not isinstance(texto, str) or texto.strip() == "":
        await enviar(usuario, {"tipo": "error", "mensaje": "Escribe una pregunta"})
        return
    if len(texto) > MAX_TEXTO:
        await enviar(usuario, {"tipo": "error", "mensaje": "La pregunta es demasiado larga (máximo %d caracteres)" % MAX_TEXTO})
        return
    if not dentro_del_limite(usuario):
        await enviar(usuario, {"tipo": "error", "mensaje": "Demasiadas preguntas seguidas, espera un poco"})
        return
    if not ias:
        await enviar(usuario, {"tipo": "error", "mensaje": "No hay ninguna IA conectada ahora mismo"})
        return

    # Elegimos la IA que menos preguntas tiene pendientes
    ia = min(ias, key=pendientes_de)

    identificador = siguiente_id
    siguiente_id += 1
    trabajos[identificador] = {"usuario": usuario, "ia": ia, "inicio": time.monotonic()}

    await enviar(ia, {"tipo": "trabajo", "id": identificador, "texto": texto.strip()})


async def tratar_respuesta(ia, datos):
    # Una IA devuelve su respuesta (o un error) y se la pasamos al usuario que preguntó
    trabajo = trabajos.get(datos.get("id"))
    if trabajo is None or trabajo["ia"] is not ia:
        return    # no es una pregunta suya o ya no existe
    del trabajos[datos["id"]]

    segundos = round(time.monotonic() - trabajo["inicio"], 1)

    if datos.get("tipo") == "respuesta" and isinstance(datos.get("texto"), str):
        await enviar(trabajo["usuario"], {
            "tipo": "respuesta", "texto": datos["texto"], "ia": ias.get(ia, "IA"), "segundos": segundos
        })
    else:
        mensaje = datos.get("mensaje") if isinstance(datos.get("mensaje"), str) else "La IA no ha podido responder"
        await enviar(trabajo["usuario"], {"tipo": "error", "mensaje": mensaje})


async def atender(conexion):
    rol = None
    try:
        # Lo primero que debe hacer quien se conecta es identificarse
        bruto = await asyncio.wait_for(conexion.recv(), timeout=TIEMPO_PRESENTACION)
        datos = json.loads(bruto)
        if not isinstance(datos, dict) or datos.get("tipo") != "hola":
            await conexion.close(1008, "Se esperaba presentación")
            return

        rol = datos.get("rol")
        nombre = datos.get("nombre")
        if not isinstance(nombre, str) or not (1 <= len(nombre.strip()) <= 20):
            await enviar(conexion, {"tipo": "error", "mensaje": "Nombre no válido (de 1 a 20 caracteres)"})
            await conexion.close(1008, "Nombre no válido")
            return
        nombre = nombre.strip()

        # Cada rol tiene su propia clave
        if rol == "usuario" and clave_correcta(datos.get("clave"), config["clave_usuarios"]):
            usuarios[conexion] = nombre
        elif rol == "ia" and clave_correcta(datos.get("clave"), config["clave_ia"]):
            ias[conexion] = nombre
        else:
            await enviar(conexion, {"tipo": "error", "mensaje": "Clave incorrecta"})
            await conexion.close(1008, "Clave incorrecta")
            rol = None
            return

        print("Conectado:", rol, nombre, "| usuarios:", len(usuarios), "| IAs:", len(ias))
        await enviar(conexion, {"tipo": "registrado", "rol": rol, "ias": len(ias)})
        await avisar_estado()

        # Bucle principal: atendemos los mensajes que lleguen
        async for bruto in conexion:
            try:
                datos = json.loads(bruto)
            except json.JSONDecodeError:
                continue
            if not isinstance(datos, dict):
                continue

            if rol == "usuario" and datos.get("tipo") == "pregunta":
                await tratar_pregunta(conexion, datos)
            elif rol == "ia" and datos.get("tipo") in ("respuesta", "error"):
                await tratar_respuesta(conexion, datos)

    except (websockets.exceptions.ConnectionClosed, asyncio.TimeoutError, json.JSONDecodeError):
        pass

    finally:
        # Limpieza al desconectarse
        if conexion in usuarios:
            del usuarios[conexion]
            historial.pop(conexion, None)
            for i in [i for i, t in trabajos.items() if t["usuario"] is conexion]:
                del trabajos[i]
        if conexion in ias:
            nombre_ia = ias.pop(conexion)
            # Los usuarios que esperaban a esta IA reciben un aviso
            for i in [i for i, t in trabajos.items() if t["ia"] is conexion]:
                await enviar(trabajos[i]["usuario"], {"tipo": "error", "mensaje": "La IA se ha desconectado, vuelve a preguntar"})
                del trabajos[i]
            print("IA desconectada:", nombre_ia)
        if rol is not None:
            await avisar_estado()


async def principal():
    # max_size limita el tamaño de lo que se puede enviar al servidor
    async with websockets.serve(atender, "0.0.0.0", PUERTO, max_size=16 * 1024):
        print("Servidor del chat escuchando en el puerto", PUERTO)
        await asyncio.Future()    # se queda funcionando para siempre


if __name__ == "__main__":
    asyncio.run(principal())
