# IA del chat: se conecta al servidor, recibe preguntas y las contesta con Ollama (un modelo local)
# Uso:
#   python3 ia.py                       IA real con Ollama
#   python3 ia.py --simulada            respuestas de mentira (solo para probar sin Ollama)
#   python3 ia.py --servidor ws://IP:8765 --nombre ia-sala2
import argparse
import asyncio
import json
import os
import socket
import time
import urllib.request

import websockets

carpeta = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(carpeta, "configuracion.json"), encoding="utf-8") as archivo:
    config = json.load(archivo)

parser = argparse.ArgumentParser()
parser.add_argument("--servidor", default="ws://127.0.0.1:%d" % config["puerto"])
parser.add_argument("--nombre", default=socket.gethostname()[:20])
parser.add_argument("--simulada", action="store_true", help="no usa Ollama: respuestas de mentira")
argumentos = parser.parse_args()


def preguntar_a_ollama(texto):
    # Llamada normal (bloqueante) a Ollama: devuelve el texto de la respuesta
    cuerpo = json.dumps({
        "model": config["modelo"],
        "stream": False,
        "messages": [
            {"role": "system", "content": "Eres un asistente interno. Responde en español, de forma breve y clara."},
            {"role": "user", "content": texto},
        ],
        "options": {"num_predict": 200},
    }).encode()
    peticion = urllib.request.Request(
        config["ollama"] + "/api/chat", data=cuerpo, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(peticion, timeout=120) as respuesta:
        datos = json.load(respuesta)
    texto_respuesta = datos.get("message", {}).get("content", "").strip()
    if texto_respuesta == "":
        raise ValueError("Ollama devolvió una respuesta vacía")
    return texto_respuesta


def respuesta_simulada(texto):
    time.sleep(1)
    return "[Respuesta simulada, sin IA real] Has preguntado: " + texto


async def contestar(conexion, trabajo):
    # Se ejecuta en otro hilo para no bloquear la conexión mientras la IA piensa
    try:
        if argumentos.simulada:
            texto = await asyncio.to_thread(respuesta_simulada, trabajo["texto"])
        else:
            texto = await asyncio.to_thread(preguntar_a_ollama, trabajo["texto"])
        await conexion.send(json.dumps({"tipo": "respuesta", "id": trabajo["id"], "texto": texto}, ensure_ascii=False))
        print("Contestada la pregunta", trabajo["id"])
    except (OSError, ValueError) as error:
        # Ollama apagado, modelo no instalado, tiempo agotado...
        print("Error con Ollama:", error)
        await conexion.send(json.dumps({
            "tipo": "error", "id": trabajo["id"],
            "mensaje": "La IA no ha podido responder (¿está Ollama iniciado y el modelo instalado?)"
        }, ensure_ascii=False))


async def principal():
    while True:
        try:
            async with websockets.connect(argumentos.servidor) as conexion:
                await conexion.send(json.dumps({
                    "tipo": "hola", "rol": "ia", "nombre": argumentos.nombre, "clave": config["clave_ia"]
                }))
                respuesta = json.loads(await conexion.recv())
                if respuesta.get("tipo") != "registrado":
                    print("Registro rechazado:", respuesta.get("mensaje"))
                    return
                print("IA conectada a", argumentos.servidor, "como", argumentos.nombre,
                      "(simulada)" if argumentos.simulada else "(modelo " + config["modelo"] + ")")

                # Atendemos las preguntas de una en una, en el orden en que llegan
                async for bruto in conexion:
                    trabajo = json.loads(bruto)
                    if trabajo.get("tipo") == "trabajo":
                        await contestar(conexion, trabajo)

        except (OSError, websockets.exceptions.ConnectionClosed) as error:
            print("Sin conexión con el servidor, reintento en 5 s:", error)
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(principal())
