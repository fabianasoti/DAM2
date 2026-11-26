# Incremental 007: pruebas y mediciones.
# Arranca el servidor y la pasarela en puertos de prueba, comprueba que todo
# funciona y mide cuánto tarda con muchos clientes a la vez.
#
# Uso (desde la carpeta del incremental):  python3 pruebas/pruebas.py
# El resultado se guarda en pruebas/salida-pruebas.txt

import asyncio
import os
import platform
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import time

CARPETA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVIDOR = os.path.join(CARPETA, "servidor.py")
PASARELA = os.path.join(CARPETA, "pasarela.py")

PUERTO = 5100            # servidor de pruebas
PUERTO_LLENO = 5101      # servidor de pruebas con solo 3 plazas
PUERTO_CARGA = 5102      # servidor de pruebas para la carga (muchas plazas)
PUERTO_WEB = 8865        # pasarela de pruebas

correctas = 0
total = 0
lineas_salida = []


def decir(texto=""):
    # Escribe en pantalla y lo guarda para el archivo de resultados
    print(texto)
    lineas_salida.append(texto)


def comprobar(condicion, descripcion):
    global correctas, total
    total += 1
    if condicion:
        correctas += 1
    decir(("  OK   " if condicion else "  FALLO ") + descripcion)


# ---------------------------------------------
# Utilidades
# ---------------------------------------------
def arrancar(script, argumentos, carpeta_trabajo):
    proceso = subprocess.Popen(
        [sys.executable, "-u", script] + [str(a) for a in argumentos],
        cwd=carpeta_trabajo,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(0.8)
    return proceso


def conectar(puerto):
    s = socket.create_connection(("localhost", puerto), timeout=5)
    return s, s.makefile("r", encoding="utf-8")


def enviar(s, texto):
    s.sendall((texto + "\n").encode("utf-8"))


def leer_hasta(archivo, condicion, maximo=20):
    # Lee líneas hasta que una cumpla la condición. Devuelve esa línea o None.
    for _ in range(maximo):
        linea = archivo.readline().strip()
        if condicion(linea):
            return linea
    return None


# ---------------------------------------------
# Pruebas de funcionamiento
# ---------------------------------------------
def pruebas_chat(carpeta_temporal):
    decir("1. Funcionamiento del chat (servidor TCP)")
    servidor = arrancar(SERVIDOR, [PUERTO], carpeta_temporal)

    try:
        a, fa = conectar(PUERTO)
        b, fb = conectar(PUERTO)
        c, fc = conectar(PUERTO)

        linea = fa.readline().strip()
        comprobar(linea == "@apodo invitado1", "el primer cliente recibe su apodo: " + linea)

        # Un mensaje llega a todos
        enviar(a, "hola a todos")
        recibido_b = leer_hasta(fb, lambda l: l.endswith("invitado1: hola a todos"))
        recibido_c = leer_hasta(fc, lambda l: l.endswith("invitado1: hola a todos"))
        comprobar(recibido_b is not None and recibido_c is not None, "un mensaje llega a todos los clientes")

        # Apodos
        enviar(b, "/nick ana")
        comprobar(leer_hasta(fb, lambda l: l == "@apodo ana") is not None, "/nick con un apodo válido")

        enviar(c, "/nick ANA")
        linea = leer_hasta(fc, lambda l: l.startswith("* Ese apodo"))
        comprobar(linea is not None, "apodo repetido rechazado (sin distinguir mayúsculas)")

        enviar(c, "/nick dos palabras")
        linea = leer_hasta(fc, lambda l: l.startswith("* El apodo debe"))
        comprobar(linea is not None, "apodo con espacios rechazado")

        enviar(c, "/nick " + "x" * 16)
        linea = leer_hasta(fc, lambda l: l.startswith("* El apodo debe"))
        comprobar(linea is not None, "apodo de más de 15 caracteres rechazado")

        # Comandos
        enviar(c, "/usuarios")
        linea = leer_hasta(fc, lambda l: l.startswith("* Conectados"))
        comprobar(linea is not None and "ana" in linea, "/usuarios muestra a los conectados: " + str(linea))

        enviar(c, "/comandoquenoexiste")
        linea = leer_hasta(fc, lambda l: "desconocido" in l)
        comprobar(linea is not None, "comando desconocido avisado")

        # Mensajes que no se aceptan
        enviar(a, "z" * 201)
        linea = leer_hasta(fa, lambda l: "demasiado largo" in l)
        comprobar(linea is not None, "mensaje de más de 200 caracteres rechazado")

        # Un cliente se cae de golpe (sin /salir)
        c.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack("ii", 1, 0))
        fc.close()
        c.close()
        time.sleep(0.5)

        enviar(a, "sigo aquí")
        linea = leer_hasta(fb, lambda l: l.endswith("invitado1: sigo aquí"))
        comprobar(linea is not None, "si un cliente se cae, el servidor sigue funcionando")

        # Salir con /salir
        enviar(b, "/salir")
        linea = leer_hasta(fa, lambda l: l == "* ana ha salido")
        comprobar(linea is not None, "/salir avisa a los demás: " + str(linea))

        a.close()

    finally:
        servidor.terminate()
        servidor.wait()

    # El registro
    ruta_log = os.path.join(carpeta_temporal, "chat.log")
    comprobar(os.path.exists(ruta_log), "se crea el archivo chat.log")
    contenido = open(ruta_log, encoding="utf-8").read()
    comprobar("Conectado: invitado1" in contenido and "Cambio de apodo" in contenido,
              "chat.log recoge conexiones y cambios de apodo")
    comprobar("hola a todos" not in contenido, "chat.log no guarda el texto de los mensajes (privacidad)")


def prueba_limite(carpeta_temporal):
    decir("")
    decir("2. Límite de clientes")
    servidor = arrancar(SERVIDOR, [PUERTO_LLENO, 3], carpeta_temporal)

    try:
        conectados = [conectar(PUERTO_LLENO) for _ in range(3)]
        time.sleep(0.3)
        s, f = conectar(PUERTO_LLENO)
        linea = f.readline().strip()
        comprobar("lleno" in linea, "con 3 plazas ocupadas, el cuarto es rechazado: " + linea)

        # Al irse uno, queda una plaza libre
        conectados[0][1].close()
        conectados[0][0].close()
        time.sleep(0.4)
        s2, f2 = conectar(PUERTO_LLENO)
        linea = f2.readline().strip()
        comprobar(linea.startswith("@apodo"), "al salir uno, vuelve a haber plaza")
    finally:
        servidor.terminate()
        servidor.wait()


# ---------------------------------------------
# Prueba de la pasarela WebSocket
# ---------------------------------------------
def prueba_pasarela(carpeta_temporal):
    decir("")
    decir("3. Pasarela WebSocket (navegador <-> servidor)")

    try:
        import websockets
    except ImportError:
        decir("  (se omite: falta la librería websockets)")
        return

    servidor = arrancar(SERVIDOR, [PUERTO], carpeta_temporal)
    pasarela = arrancar(PASARELA, [PUERTO_WEB, PUERTO], carpeta_temporal)

    async def probar():
        async with websockets.connect(f"ws://localhost:{PUERTO_WEB}") as web:
            primera = await asyncio.wait_for(web.recv(), 3)
            comprobar(primera.startswith("@apodo "), "el navegador recibe su apodo a través de la pasarela")

            # Un cliente TCP normal en la misma sala
            tcp, ftcp = conectar(PUERTO)
            leer_hasta(ftcp, lambda l: l.startswith("Bienvenido"))

            await web.send("/nick webana")
            recibido = False
            for _ in range(6):
                if await asyncio.wait_for(web.recv(), 3) == "@apodo webana":
                    recibido = True
                    break
            comprobar(recibido, "un comando enviado desde el navegador llega al servidor")

            enviar(tcp, "hola desde TCP")
            llega_a_web = False
            for _ in range(8):
                mensaje = await asyncio.wait_for(web.recv(), 3)
                if mensaje.endswith("hola desde TCP"):
                    llega_a_web = True
                    break
            comprobar(llega_a_web, "un mensaje de un cliente TCP llega al navegador")

            await web.send("hola desde la web")
            linea = leer_hasta(ftcp, lambda l: l.endswith("webana: hola desde la web"))
            comprobar(linea is not None, "un mensaje del navegador llega a un cliente TCP")

            await web.send("/salir")
            cerrada = False
            try:
                while True:
                    await asyncio.wait_for(web.recv(), 3)
            except websockets.ConnectionClosed:
                cerrada = True
            comprobar(cerrada, "/salir cierra la conexión WebSocket")

        servidor.terminate()
        servidor.wait()
        await asyncio.sleep(0.3)

        async with websockets.connect(f"ws://localhost:{PUERTO_WEB}") as web2:
            mensaje = await asyncio.wait_for(web2.recv(), 3)
            comprobar("No se puede conectar" in mensaje, "sin servidor de chat, el navegador recibe un aviso claro")

    try:
        asyncio.run(probar())
    finally:
        pasarela.terminate()
        pasarela.wait()
        servidor.terminate()


# ---------------------------------------------
# Mediciones con muchos clientes a la vez
# ---------------------------------------------
def medir_carga(carpeta_temporal, numero):
    # Conecta "numero" clientes; cada uno envía 1 mensaje y todos deben recibir los "numero" mensajes
    servidor = arrancar(SERVIDOR, [PUERTO_CARGA, numero + 10], carpeta_temporal)
    resultado = None

    try:
        inicio = time.time()
        sockets = [socket.create_connection(("localhost", PUERTO_CARGA), timeout=20) for _ in range(numero)]
        tiempo_conexion = time.time() - inicio

        recibidos = [0] * numero

        def escuchar(posicion):
            # Cada cliente cuenta cuántos mensajes de chat recibe (empiezan por "[")
            archivo = sockets[posicion].makefile("r", encoding="utf-8")
            while recibidos[posicion] < numero:
                linea = archivo.readline()
                if linea == "":
                    break
                if linea.startswith("["):
                    recibidos[posicion] += 1

        hilos = [threading.Thread(target=escuchar, args=(i,), daemon=True) for i in range(numero)]
        for hilo in hilos:
            hilo.start()

        inicio = time.time()
        for i, s in enumerate(sockets):
            enviar(s, "mensaje " + str(i))
        for hilo in hilos:
            hilo.join(timeout=30)
        tiempo_reparto = time.time() - inicio

        todos = all(r == numero for r in recibidos)
        resultado = (numero, tiempo_conexion, tiempo_reparto, todos)

        for s in sockets:
            s.close()
    finally:
        servidor.terminate()
        servidor.wait()

    return resultado


def pruebas_carga(carpeta_temporal):
    decir("")
    decir("4. Carga: N clientes a la vez, cada uno envía 1 mensaje y todos reciben los N mensajes")
    decir("")
    decir("| Clientes | Mensajes entregados | Conectar (s) | Repartir (s) | Resultado |")
    decir("|---|---|---|---|---|")

    for numero in [10, 50, 100, 200]:
        n, t_conexion, t_reparto, todos = medir_carga(carpeta_temporal, numero)
        decir(f"| {n} | {n * n} | {t_conexion:.2f} | {t_reparto:.2f} | {'correcto' if todos else 'FALLO'} |")
        comprobar(todos, f"{n} clientes: todos reciben los {n} mensajes")


# ---------------------------------------------
# Programa principal
# ---------------------------------------------
decir("Pruebas del chat de sala")
decir(f"Equipo: {os.cpu_count()} hilos de CPU, Python {platform.python_version()}, {platform.system()}")
decir("Las pruebas se hacen en el mismo equipo (localhost), no en una red real.")
decir("")

carpeta_temporal = tempfile.mkdtemp()

pruebas_chat(carpeta_temporal)
prueba_limite(carpeta_temporal)
prueba_pasarela(carpeta_temporal)
pruebas_carga(carpeta_temporal)

decir("")
decir(f"RESULTADO: {correctas} de {total} comprobaciones correctas")

with open(os.path.join(CARPETA, "pruebas", "salida-pruebas.txt"), "w", encoding="utf-8") as archivo:
    archivo.write("\n".join(lineas_salida) + "\n")

sys.exit(0 if correctas == total else 1)
