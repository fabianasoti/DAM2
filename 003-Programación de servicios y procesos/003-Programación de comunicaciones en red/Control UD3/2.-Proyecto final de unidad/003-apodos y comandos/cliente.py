# Incremental 003: cliente de terminal.
# Igual que el 002, pero entiende los avisos "@apodo" del servidor.
# Escribe /ayuda para ver los comandos del chat.

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
    entrada = cliente.makefile("r", encoding="utf-8", errors="replace")
    try:
        for linea in entrada:
            texto = linea.strip()

            if texto.startswith("@apodo "):
                print("(tu apodo es ahora " + texto[7:] + ")")
            else:
                print(texto)
    except OSError:
        pass
    print("Desconectado del servidor.")


threading.Thread(target=recibir, daemon=True).start()

while True:
    try:
        mensaje = input()
    except EOFError:
        break

    try:
        cliente.sendall((mensaje + "\n").encode("utf-8"))
    except OSError:
        break

    if mensaje == "/salir" or mensaje == "salir":
        break

cliente.close()
