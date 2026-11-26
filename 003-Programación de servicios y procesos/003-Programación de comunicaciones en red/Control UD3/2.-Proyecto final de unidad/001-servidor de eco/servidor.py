# Incremental 001: servidor de eco.
# Atiende a UN cliente cada vez y le devuelve lo que escribe.
# TCP es un flujo de bytes: para separar los mensajes usamos líneas (\n).

import socket

IP = "localhost"     # solo acepta conexiones de este ordenador
PUERTO = 5000

# Creo el socket TCP del servidor
servidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
servidor.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
servidor.bind((IP, PUERTO))
servidor.listen()

print(f"Servidor de eco escuchando en {IP}:{PUERTO}")

while True:
    # Espero a que un cliente se conecte
    conexion, direccion = servidor.accept()
    print("Cliente conectado:", direccion)

    # makefile me deja leer el socket línea a línea
    archivo = conexion.makefile("r", encoding="utf-8")

    for linea in archivo:
        mensaje = linea.strip()
        print("Recibido:", mensaje)
        conexion.sendall(("Eco: " + mensaje + "\n").encode("utf-8"))

    conexion.close()
    print("Cliente desconectado:", direccion)
