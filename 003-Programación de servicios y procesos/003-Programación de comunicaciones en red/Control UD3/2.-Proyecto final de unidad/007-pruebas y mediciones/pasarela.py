# Incremental 005: pasarela WebSocket.
# Un navegador no puede abrir un socket TCP, pero sí un WebSocket.
# La pasarela hace de puente:
#
#   navegador  <-- WebSocket -->  pasarela.py  <-- TCP -->  servidor.py
#
# Para el navegador, la pasarela es un SERVIDOR (WebSocket).
# Para el servidor de chat, la pasarela es un CLIENTE más (TCP).
#
# Uso: python3 pasarela.py [puerto web] [puerto del servidor de chat]
# Necesita la librería websockets: sudo apt install python3-websockets

import asyncio
import sys

import websockets

IP_WEB = "0.0.0.0"           # "0.0.0.0" para aceptar navegadores de otros equipos
PUERTO_WEB = 8765
IP_CHAT = "localhost"          # dónde está el servidor de chat (TCP)
PUERTO_CHAT = 5000

try:
    if len(sys.argv) > 1:
        PUERTO_WEB = int(sys.argv[1])
    if len(sys.argv) > 2:
        PUERTO_CHAT = int(sys.argv[2])
except ValueError:
    print("Uso: python3 pasarela.py [puerto web] [puerto del servidor de chat]")
    raise SystemExit


async def atender(websocket):
    # Se ejecuta una vez por cada navegador que se conecta

    print("Navegador conectado:", websocket.remote_address)

    # Abro una conexión TCP con el servidor de chat, como haría cualquier cliente
    try:
        lector, escritor = await asyncio.open_connection(IP_CHAT, PUERTO_CHAT)
    except OSError:
        await websocket.send("* No se puede conectar con el servidor de chat.")
        await websocket.close()
        print("No hay servidor de chat en", IP_CHAT, PUERTO_CHAT)
        return

    async def del_servidor_al_navegador():
        # Cada línea que manda el servidor de chat se la paso al navegador
        try:
            while True:
                linea = await lector.readline()
                if not linea:
                    break                          # el servidor ha cerrado
                await websocket.send(linea.decode("utf-8", errors="replace").rstrip("\n"))
        except (websockets.ConnectionClosed, OSError):
            pass                                   # el navegador o el servidor se han ido

    async def del_navegador_al_servidor():
        # Cada mensaje del navegador se lo paso al servidor como una línea
        try:
            async for mensaje in websocket:
                if isinstance(mensaje, str):
                    una_linea = mensaje.replace("\n", " ").replace("\r", " ")
                    escritor.write((una_linea + "\n").encode("utf-8"))
                    await escritor.drain()
        except (websockets.ConnectionClosed, OSError):
            pass

    tareas = [
        asyncio.create_task(del_servidor_al_navegador()),
        asyncio.create_task(del_navegador_al_servidor()),
    ]

    # Cuando acabe una de las dos direcciones, termino la otra también
    hechas, pendientes = await asyncio.wait(tareas, return_when=asyncio.FIRST_COMPLETED)
    for tarea in pendientes:
        tarea.cancel()

    # Espero a que terminen las dos, para que no quede ningún error sin recoger
    await asyncio.gather(*tareas, return_exceptions=True)

    escritor.close()
    await websocket.close()
    print("Navegador desconectado")


async def main():
    async with websockets.serve(atender, IP_WEB, PUERTO_WEB):
        print(f"Pasarela escuchando en ws://{IP_WEB}:{PUERTO_WEB} -> servidor de chat {IP_CHAT}:{PUERTO_CHAT}")
        await asyncio.Future()                     # se queda esperando


try:
    asyncio.run(main())
except KeyboardInterrupt:
    print("Pasarela detenida")
