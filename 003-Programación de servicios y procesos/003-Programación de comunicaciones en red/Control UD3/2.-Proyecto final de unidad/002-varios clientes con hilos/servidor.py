# Incremental 002: varios clientes a la vez con hilos.
# Cada cliente que se conecta tiene su propio hilo.
# Lo que escribe un cliente se reparte a todos los conectados.
# Los hilos comparten la lista de clientes, así que la protejo con un Lock.

import socket
import threading

IP = "localhost"     # "0.0.0.0" para aceptar también a otros ordenadores
PUERTO = 5000

servidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
servidor.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
servidor.bind((IP, PUERTO))
servidor.listen()

clientes = {}                 # conexión -> nombre
lock = threading.Lock()       # protege "clientes" y "contador"
contador = 0

print(f"Servidor de chat escuchando en {IP}:{PUERTO}")


def enviar(conexion, texto):
    # Envía una línea a un cliente. Si falla, no pasa nada.
    try:
        conexion.sendall((texto + "\n").encode("utf-8"))
    except OSError:
        pass


def difundir(texto):
    # Envía una línea a todos los clientes conectados
    with lock:
        destinatarios = list(clientes)

    for conexion in destinatarios:
        enviar(conexion, texto)


def atender_cliente(conexion, direccion):
    global contador

    # Le doy un nombre provisional
    with lock:
        contador += 1
        nombre = "invitado" + str(contador)
        clientes[conexion] = nombre

    print("Cliente conectado:", nombre, direccion)
    difundir("* " + nombre + " se ha unido a la sala")

    archivo = conexion.makefile("r", encoding="utf-8")

    try:
        for linea in archivo:
            mensaje = linea.strip()
            if mensaje != "":
                difundir(nombre + ": " + mensaje)
    except OSError:
        pass
    finally:
        with lock:
            clientes.pop(conexion, None)
        conexion.close()
        print("Cliente desconectado:", nombre)
        difundir("* " + nombre + " ha salido")


while True:
    conexion, direccion = servidor.accept()

    # Un hilo nuevo para este cliente: el servidor sigue aceptando a los demás
    hilo = threading.Thread(
        target=atender_cliente,
        args=(conexion, direccion),
        daemon=True
    )
    hilo.start()
