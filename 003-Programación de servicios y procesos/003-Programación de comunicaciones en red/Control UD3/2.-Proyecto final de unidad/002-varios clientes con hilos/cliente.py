# Incremental 002: cliente de terminal con dos hilos.
# Un hilo escucha lo que llega del servidor mientras el principal lee lo que escribes.

import socket
import threading

IP = "localhost"
PUERTO = 5000

cliente = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

try:
    cliente.connect((IP, PUERTO))
except ConnectionRefusedError:
    print("No se puede conectar: ¿está arrancado el servidor?")
    raise SystemExit


def recibir():
    # Se ejecuta en un hilo aparte: imprime cada línea que llega
    entrada = cliente.makefile("r", encoding="utf-8")
    try:
        for linea in entrada:
            print(linea.strip())
    except OSError:
        pass
    print("Desconectado del servidor.")


threading.Thread(target=recibir, daemon=True).start()

print("Conectado. Escribe 'salir' para terminar.")

while True:
    try:
        mensaje = input()
    except EOFError:
        break

    if mensaje == "salir":
        break

    try:
        cliente.sendall((mensaje + "\n").encode("utf-8"))
    except OSError:
        break

cliente.close()
