# Pruebas del chat con IA local. Arranca el servidor y las IAs de verdad y hace de usuario.
# Ollama se sustituye por uno FALSO (un servidor HTTP mínimo) porque no hay Ollama en este equipo.
# Uso (desde esta carpeta): PYTHONPATH=<carpeta de websockets> python3 probar_chat.py
import asyncio
import json
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import websockets

PROYECTO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "proyecto")
with open(os.path.join(PROYECTO, "configuracion.json")) as f:
    CONFIG = json.load(f)
URL = "ws://127.0.0.1:%d" % CONFIG["puerto"]
procesos = []


def lanzar(*argumentos, es_ia=True):
    p = subprocess.Popen([sys.executable] + list(argumentos), cwd=PROYECTO,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if es_ia:
        procesos.append(p)
    return p


# ---------- Ollama falso ----------
class OllamaFalso(BaseHTTPRequestHandler):
    def do_POST(self):
        datos = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        pregunta = datos["messages"][-1]["content"]
        time.sleep(0.3)
        cuerpo = json.dumps({"message": {"content": "[Ollama falso de prueba] respuesta a: " + pregunta}}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(cuerpo)

    def log_message(self, *a):
        pass


# ---------- Ayudas ----------
async def conectar(rol="usuario", nombre="Ana", clave=None):
    ws = await websockets.connect(URL)
    clave = clave if clave is not None else CONFIG["clave_usuarios" if rol == "usuario" else "clave_ia"]
    await ws.send(json.dumps({"tipo": "hola", "rol": rol, "nombre": nombre, "clave": clave}))
    return ws


async def esperar(ws, tipos, tiempo=8):
    # Lee mensajes hasta encontrar uno de los tipos indicados
    fin = time.monotonic() + tiempo
    while True:
        resto = fin - time.monotonic()
        if resto <= 0:
            return None
        try:
            m = json.loads(await asyncio.wait_for(ws.recv(), resto))
        except (asyncio.TimeoutError, websockets.exceptions.ConnectionClosed):
            return None
        if m["tipo"] in tipos:
            return m


async def esperar_ias(ws, cuantas, tiempo=8):
    # Lee avisos de estado hasta que el número de IAs conectadas sea el indicado
    fin = time.monotonic() + tiempo
    while time.monotonic() < fin:
        m = await esperar(ws, ["estado"], tiempo=fin - time.monotonic())
        if m is not None and m["ias"] == cuantas:
            return m
    return None


def informe(nombre, ok, detalle=""):
    print(("OK    " if ok else "FALLO ") + nombre + (" -> " + detalle if detalle else ""))


async def usuario_listo(nombre="Ana"):
    ws = await conectar("usuario", nombre)
    await esperar(ws, ["registrado"])
    return ws


async def pruebas():
    # 1. Presentación y claves
    ws = await conectar("usuario", "Ana", clave="mala")
    m = await esperar(ws, ["error"])
    informe("clave incorrecta se rechaza", m is not None and m["mensaje"] == "Clave incorrecta", str(m))

    ws = await conectar("usuario", "")
    m = await esperar(ws, ["error"])
    informe("nombre vacío se rechaza", m is not None, str(m))

    ws = await conectar("administrador", "Ana")
    m = await esperar(ws, ["error"])
    informe("rol desconocido se rechaza", m is not None, str(m))

    ws = await websockets.connect(URL)
    await ws.send(json.dumps({"tipo": "pregunta", "texto": "hola"}))
    try:
        await asyncio.wait_for(ws.recv(), 3)
        informe("mensaje sin presentación se cierra", False)
    except websockets.exceptions.ConnectionClosed:
        informe("mensaje sin presentación se cierra", True)
    except asyncio.TimeoutError:
        informe("mensaje sin presentación se cierra", False, "sigue abierto")

    ws = await websockets.connect(URL)
    inicio = time.monotonic()
    try:
        await asyncio.wait_for(ws.recv(), 15)
    except websockets.exceptions.ConnectionClosed:
        pass
    informe("conexión muda se cierra a los ~10 s", 9 < time.monotonic() - inicio < 12, "%.1f s" % (time.monotonic() - inicio))

    # 2. Sin ninguna IA
    ana = await usuario_listo("Ana")
    await ana.send(json.dumps({"tipo": "pregunta", "texto": "¿hay alguien?"}))
    m = await esperar(ana, ["error", "respuesta"])
    informe("sin IAs, aviso claro", m is not None and "No hay ninguna IA" in m["mensaje"], str(m))

    # 3. Una IA simulada
    lanzar("ia.py", "--simulada", "--nombre", "ia-1")
    m = await esperar_ias(ana, 1)
    informe("el usuario ve que hay 1 IA", m is not None and m["ias"] == 1, str(m))
    await ana.send(json.dumps({"tipo": "pregunta", "texto": "¿Qué es un hilo?"}))
    m = await esperar(ana, ["respuesta", "error"])
    informe("pregunta y respuesta con IA simulada", m is not None and m["tipo"] == "respuesta" and m["ia"] == "ia-1", str(m))

    # 4. Límites
    await ana.send(json.dumps({"tipo": "pregunta", "texto": "x" * 501}))
    m = await esperar(ana, ["error", "respuesta"])
    informe("pregunta de 501 caracteres se rechaza", m is not None and "demasiado larga" in m["mensaje"], str(m))
    await ana.send(json.dumps({"tipo": "pregunta", "texto": "   "}))
    m = await esperar(ana, ["error", "respuesta"])
    informe("pregunta vacía se rechaza", m is not None and "Escribe" in m["mensaje"], str(m))

    luis = await usuario_listo("Luis")
    for i in range(11):
        await luis.send(json.dumps({"tipo": "pregunta", "texto": "pregunta %d" % i}))
    limitados = 0
    respondidas = 0
    for _ in range(11):
        m = await esperar(luis, ["error", "respuesta"], tiempo=20)
        if m is None:
            break
        if m["tipo"] == "error" and "Demasiadas" in m["mensaje"]:
            limitados += 1
        elif m["tipo"] == "respuesta":
            respondidas += 1
    informe("límite de 10 preguntas por minuto", limitados == 1 and respondidas == 10, "respondidas=%d, limitadas=%d" % (respondidas, limitados))

    # 5. Reparto entre dos IAs
    lanzar("ia.py", "--simulada", "--nombre", "ia-2")
    await esperar_ias(ana, 2)
    usuarios = [await usuario_listo("U%d" % i) for i in range(4)]
    inicio = time.monotonic()
    for u in usuarios:
        await u.send(json.dumps({"tipo": "pregunta", "texto": "a"}))
        await u.send(json.dumps({"tipo": "pregunta", "texto": "b"}))
    por_ia = {}
    for u in usuarios:
        for _ in range(2):
            m = await esperar(u, ["respuesta", "error"], tiempo=20)
            if m and m["tipo"] == "respuesta":
                por_ia[m["ia"]] = por_ia.get(m["ia"], 0) + 1
    tiempo = time.monotonic() - inicio
    informe("8 preguntas repartidas entre 2 IAs (1 s cada una)", len(por_ia) == 2 and sum(por_ia.values()) == 8,
            "%s en %.1f s (con una sola IA serían ~8 s)" % (por_ia, tiempo))
    # Esta tabla alimenta la ficha
    for u in usuarios:
        await u.close()

    # 6. Una IA se cae con una pregunta pendiente
    for p in procesos:
        p.terminate()
    procesos.clear()
    await esperar_ias(ana, 0)
    ia_lenta = lanzar("ia.py", "--simulada", "--nombre", "ia-cae")
    await esperar_ias(ana, 1)
    await ana.send(json.dumps({"tipo": "pregunta", "texto": "me quedo esperando"}))
    await asyncio.sleep(0.3)
    ia_lenta.kill()
    m = await esperar(ana, ["error", "respuesta"])
    informe("si la IA se cae, el usuario recibe aviso", m is not None and "desconectado" in m["mensaje"], str(m))
    procesos.clear()
    await esperar_ias(ana, 0)

    # 7. Ollama (falso) y Ollama apagado
    servidor_falso = HTTPServer(("127.0.0.1", 11434), OllamaFalso)
    hilo = threading.Thread(target=servidor_falso.serve_forever, daemon=True)
    hilo.start()
    lanzar("ia.py", "--nombre", "ia-ollama")
    await esperar_ias(ana, 1)
    await ana.send(json.dumps({"tipo": "pregunta", "texto": "¿Qué hora es?"}))
    m = await esperar(ana, ["respuesta", "error"])
    informe("IA real hablando con un Ollama falso", m is not None and m["tipo"] == "respuesta" and "Ollama falso" in m["texto"], str(m))
    servidor_falso.shutdown()
    servidor_falso.server_close()
    await ana.send(json.dumps({"tipo": "pregunta", "texto": "¿Sigues ahí?"}))
    m = await esperar(ana, ["respuesta", "error"])
    informe("con Ollama apagado, error claro", m is not None and m["tipo"] == "error" and "Ollama" in m["mensaje"], str(m))


async def principal():
    servidor = lanzar("servidor.py", es_ia=False)
    await asyncio.sleep(1.5)
    try:
        await pruebas()
    finally:
        for p in procesos + [servidor]:
            p.kill()


asyncio.run(principal())
