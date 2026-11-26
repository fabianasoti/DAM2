# Incremental 004: registro y gestión de errores.
# Novedades respecto al 003:
#   - Todo lo importante se anota en chat.log (para depurar).
#   - Límite de clientes y de longitud de mensaje.
#   - Si un cliente se cae, el servidor lo quita y sigue funcionando.
#   - Puerto y máximo de clientes por línea de comandos.
#   - Ctrl+C cierra el servidor de forma ordenada.
#
# Uso: python3 servidor.py [puerto] [máximo de clientes]
# Protocolo (texto, una línea por mensaje):
#   /nick nombre   cambia tu apodo
#   /usuarios      muestra quién está conectado
#   /ayuda         muestra los comandos
#   /salir         sale del chat
# Cualquier otra línea es un mensaje para toda la sala.
# Líneas que empiezan por "@apodo " son avisos internos para el cliente.

import socket
import sys
import threading
import time

IP = "localhost"          # "0.0.0.0" para aceptar también a otros ordenadores
PUERTO = 5000
MAX_CLIENTES = 50
MAX_LONGITUD = 200        # caracteres por mensaje
ARCHIVO_LOG = "chat.log"

# Puerto y máximo de clientes opcionales por línea de comandos
try:
    if len(sys.argv) > 1:
        PUERTO = int(sys.argv[1])
    if len(sys.argv) > 2:
        MAX_CLIENTES = int(sys.argv[2])
except ValueError:
    print("Uso: python3 servidor.py [puerto] [máximo de clientes]")
    raise SystemExit

clientes = {}                      # conexión -> apodo
lock = threading.Lock()            # protege "clientes" y "contador"
lock_log = threading.Lock()        # una sola escritura a la vez en el log
contador = 0


def registrar(texto):
    # Anota una línea con la fecha en pantalla y en chat.log
    linea = time.strftime("%Y-%m-%d %H:%M:%S") + " " + texto

    with lock_log:
        print(linea)
        with open(ARCHIVO_LOG, "a", encoding="utf-8") as archivo:
            archivo.write(linea + "\n")


def hora():
    return time.strftime("%H:%M")


def enviar(conexion, texto):
    # Envía una línea. Devuelve False si el cliente ya no responde.
    try:
        conexion.sendall((texto + "\n").encode("utf-8"))
        return True
    except OSError:
        return False


def difundir(texto):
    # Envía una línea a todos. Quita a los que ya no responden.
    with lock:
        destinatarios = list(clientes)

    for conexion in destinatarios:
        if not enviar(conexion, texto):
            with lock:
                apodo = clientes.pop(conexion, None)
            if apodo is not None:
                registrar("Cliente caído, lo quito: " + apodo)
            conexion.close()


def error_de_apodo(nuevo):
    # Devuelve un texto de error, o "" si el apodo es correcto
    if len(nuevo) < 1 or len(nuevo) > 15 or not nuevo.isalnum():
        return "El apodo debe tener de 1 a 15 letras o números, sin espacios."
    return ""


def cambiar_apodo(conexion, nuevo):
    error = error_de_apodo(nuevo)
    if error != "":
        enviar(conexion, "* " + error)
        return

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
        return

    registrar("Cambio de apodo: " + anterior + " -> " + nuevo)
    enviar(conexion, "@apodo " + nuevo)
    difundir("* " + anterior + " ahora se llama " + nuevo)


def atender_cliente(conexion, direccion):
    # El apodo ya lo ha reservado el bucle principal antes de crear el hilo
    with lock:
        apodo = clientes[conexion]
    ultimo_apodo = apodo          # lo recuerdo para el aviso final

    registrar("Conectado: " + apodo + " " + str(direccion))
    enviar(conexion, "@apodo " + apodo)
    enviar(conexion, "Bienvenido, eres " + apodo + ". Escribe /ayuda para ver los comandos.")
    difundir("* " + apodo + " se ha unido a la sala")

    archivo = conexion.makefile("r", encoding="utf-8", errors="replace")

    try:
        for linea in archivo:
            texto = linea.strip()

            with lock:
                apodo = clientes.get(conexion)
            if apodo is None:
                break                      # me han quitado por no responder
            ultimo_apodo = apodo

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

            elif len(texto) > MAX_LONGITUD:
                enviar(conexion, "* Mensaje demasiado largo (máximo " + str(MAX_LONGITUD) + " caracteres).")
                registrar("Mensaje rechazado de " + apodo + " (" + str(len(texto)) + " caracteres)")

            else:
                registrar("Mensaje de " + apodo + " (" + str(len(texto)) + " caracteres)")
                difundir("[" + hora() + "] " + apodo + ": " + texto)

    except OSError as error:
        registrar("Error de red con " + ultimo_apodo + ": " + str(error))
    finally:
        with lock:
            apodo = clientes.pop(conexion, None)
        if apodo is not None:
            ultimo_apodo = apodo
        conexion.close()
        registrar("Desconectado: " + ultimo_apodo)
        difundir("* " + ultimo_apodo + " ha salido")


# ---------------------------------------------
# Programa principal
# ---------------------------------------------
servidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
servidor.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

try:
    servidor.bind((IP, PUERTO))
except OSError as error:
    print("No puedo usar el puerto " + str(PUERTO) + ": " + str(error))
    raise SystemExit

servidor.listen()
registrar("Servidor escuchando en " + IP + ":" + str(PUERTO) + " (máximo " + str(MAX_CLIENTES) + " clientes)")

try:
    while True:
        conexion, direccion = servidor.accept()

        # Reservo plaza y apodo aquí, para que el límite sea exacto
        with lock:
            lleno = len(clientes) >= MAX_CLIENTES
            if not lleno:
                contador += 1
                clientes[conexion] = "invitado" + str(contador)

        if lleno:
            enviar(conexion, "* El servidor está lleno, inténtalo más tarde.")
            conexion.close()
            registrar("Rechazado (servidor lleno): " + str(direccion))
            continue

        hilo = threading.Thread(
            target=atender_cliente,
            args=(conexion, direccion),
            daemon=True
        )
        hilo.start()

except KeyboardInterrupt:
    registrar("Servidor detenido con Ctrl+C")
finally:
    servidor.close()
