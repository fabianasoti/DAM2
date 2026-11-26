# Incremental 003: apodos y comandos.
# Protocolo de texto, un mensaje por línea:
#   /nick nombre   cambia tu apodo
#   /usuarios      muestra quién está conectado
#   /ayuda         muestra los comandos
#   /salir         sale del chat
# Cualquier otra línea es un mensaje para toda la sala.
# Líneas que empiezan por "@apodo " son avisos internos para el cliente.

import socket
import threading
import time

IP = "localhost"     # "0.0.0.0" para aceptar también a otros ordenadores
PUERTO = 5000

servidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
servidor.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
servidor.bind((IP, PUERTO))
servidor.listen()

clientes = {}                 # conexión -> apodo
lock = threading.Lock()       # protege "clientes" y "contador"
contador = 0

print(f"Servidor de chat escuchando en {IP}:{PUERTO}")


def hora():
    return time.strftime("%H:%M")


def enviar(conexion, texto):
    try:
        conexion.sendall((texto + "\n").encode("utf-8"))
    except OSError:
        pass


def difundir(texto):
    with lock:
        destinatarios = list(clientes)

    for conexion in destinatarios:
        enviar(conexion, texto)


def error_de_apodo(nuevo):
    # Devuelve un texto de error, o "" si el apodo es correcto
    if len(nuevo) < 1 or len(nuevo) > 15 or not nuevo.isalnum():
        return "El apodo debe tener de 1 a 15 letras o números, sin espacios."
    return ""


def cambiar_apodo(conexion, nuevo):
    # Devuelve el apodo anterior si se ha cambiado, o None si no se ha podido
    error = error_de_apodo(nuevo)
    if error != "":
        enviar(conexion, "* " + error)
        return None

    en_uso = False

    with lock:
        for otra, apodo in clientes.items():
            if otra != conexion and apodo.lower() == nuevo.lower():
                en_uso = True

        if not en_uso:
            anterior = clientes[conexion]
            clientes[conexion] = nuevo

    # Envío fuera del candado, para no bloquear a los demás hilos
    if en_uso:
        enviar(conexion, "* Ese apodo ya está en uso.")
        return None

    enviar(conexion, "@apodo " + nuevo)
    difundir("* " + anterior + " ahora se llama " + nuevo)
    return anterior


def atender_cliente(conexion, direccion):
    global contador

    with lock:
        contador += 1
        apodo = "invitado" + str(contador)
        clientes[conexion] = apodo

    print("Cliente conectado:", apodo, direccion)
    enviar(conexion, "@apodo " + apodo)
    enviar(conexion, "Bienvenido, eres " + apodo + ". Escribe /ayuda para ver los comandos.")
    difundir("* " + apodo + " se ha unido a la sala")

    archivo = conexion.makefile("r", encoding="utf-8", errors="replace")

    try:
        for linea in archivo:
            texto = linea.strip()

            with lock:
                apodo = clientes[conexion]    # puede haber cambiado

            if texto == "":
                continue

            elif texto == "/salir":
                break

            elif texto == "/ayuda":
                enviar(conexion, "* Comandos: /nick nombre, /usuarios, /ayuda, /salir")

            elif texto == "/usuarios":
                with lock:
                    lista = ", ".join(clientes.values())
                enviar(conexion, "* Conectados: " + lista)

            elif texto.startswith("/nick "):
                cambiar_apodo(conexion, texto[6:].strip())

            elif texto.startswith("/"):
                enviar(conexion, "* Comando desconocido. Escribe /ayuda")

            else:
                difundir("[" + hora() + "] " + apodo + ": " + texto)

    except OSError:
        pass
    finally:
        with lock:
            apodo = clientes.pop(conexion, apodo)
        conexion.close()
        print("Cliente desconectado:", apodo)
        difundir("* " + apodo + " ha salido")


while True:
    conexion, direccion = servidor.accept()

    hilo = threading.Thread(
        target=atender_cliente,
        args=(conexion, direccion),
        daemon=True
    )
    hilo.start()
