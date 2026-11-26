# Incremental 001: cliente de terminal.
# Se conecta al servidor, envía lo que escribes y muestra la respuesta.

import socket

IP = "localhost"
PUERTO = 5000

cliente = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

try:
    cliente.connect((IP, PUERTO))
except ConnectionRefusedError:
    print("No se puede conectar: ¿está arrancado el servidor?")
    raise SystemExit

entrada = cliente.makefile("r", encoding="utf-8")
print("Conectado. Escribe 'salir' para terminar.")

while True:
    mensaje = input("> ")

    if mensaje == "salir":
        break

    cliente.sendall((mensaje + "\n").encode("utf-8"))

    respuesta = entrada.readline()
    print(respuesta.strip())

cliente.close()
