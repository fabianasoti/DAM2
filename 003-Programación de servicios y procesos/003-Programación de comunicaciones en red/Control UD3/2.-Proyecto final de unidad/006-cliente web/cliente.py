# Incremental 004: cliente de terminal.
# Uso: python3 cliente.py [ip] [puerto]
# Escribe /ayuda para ver los comandos del chat.

import socket
import sys
import threading

IP = "localhost"
PUERTO = 5000

try:
    if len(sys.argv) > 1:
        IP = sys.argv[1]
    if len(sys.argv) > 2:
        PUERTO = int(sys.argv[2])
except ValueError:
    print("Uso: python3 cliente.py [ip] [puerto]")
    raise SystemExit

cliente = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

try:
    cliente.connect((IP, PUERTO))
except (ConnectionRefusedError, socket.gaierror, TimeoutError):
    print("No se puede conectar con " + IP + ":" + str(PUERTO) + ". ¿Está arrancado el servidor?")
    raise SystemExit


def recibir():
    # Hilo que imprime lo que llega del servidor
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
    print("Desconectado del servidor. Pulsa Intro para salir.")


threading.Thread(target=recibir, daemon=True).start()

while True:
    try:
        mensaje = input()
    except (EOFError, KeyboardInterrupt):
        break

    try:
        cliente.sendall((mensaje + "\n").encode("utf-8"))
    except OSError:
        break

    if mensaje == "/salir" or mensaje == "salir":
        break

cliente.close()
