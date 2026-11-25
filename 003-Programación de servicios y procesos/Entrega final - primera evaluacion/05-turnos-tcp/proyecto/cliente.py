# Cliente del sistema de turnos
# Uso:
#   python3 cliente.py pedir Ana        pide un turno
#   python3 cliente.py mostrador 2      (Enter) llama al siguiente desde el mostrador 2
#   python3 cliente.py pantalla         pantalla de la sala: muestra a quién se llama
# Opcional al final: la dirección del servidor y el puerto (por defecto 127.0.0.1 5050)
import socket
import sys

LILA = "\033[38;5;141m"
VERDE = "\033[38;5;77m"
GRIS = "\033[38;5;245m"
NORMAL = "\033[0m"

if len(sys.argv) < 2 or sys.argv[1] not in ("pedir", "mostrador", "pantalla"):
    print("Uso: python3 cliente.py pedir NOMBRE | mostrador NUMERO | pantalla  [IP] [PUERTO]")
    sys.exit(1)

modo = sys.argv[1]
argumento = sys.argv[2] if modo in ("pedir", "mostrador") and len(sys.argv) > 2 else ""
if modo in ("pedir", "mostrador") and argumento == "":
    print("Falta el", "nombre" if modo == "pedir" else "numero de mostrador")
    sys.exit(1)

resto = sys.argv[3 if modo in ("pedir", "mostrador") else 2:]
IP = resto[0] if len(resto) > 0 else "127.0.0.1"
PUERTO = int(resto[1]) if len(resto) > 1 else 5050

try:
    conexion = socket.create_connection((IP, PUERTO), timeout=5)
except OSError:
    print("No se puede conectar con el servidor de turnos en", IP, PUERTO)
    sys.exit(1)

lector = conexion.makefile("r", encoding="utf-8")    # para leer línea a línea


def preguntar(orden):
    conexion.sendall((orden + "\n").encode("utf-8"))
    return lector.readline().strip()


if modo == "pedir":
    respuesta = preguntar("PEDIR " + argumento).split(" ")
    if respuesta[0] == "TURNO":
        delante = int(respuesta[3])
        texto = "no hay nadie delante" if delante == 0 else "hay %d %s delante" % (delante, "persona" if delante == 1 else "personas")
        print("%sTu turno es el %s%s%s: %s.%s" % (LILA, VERDE, respuesta[1], LILA, texto, NORMAL))
    else:
        print("El servidor dice:", " ".join(respuesta))

elif modo == "mostrador":
    print("Mostrador %s. Pulsa Enter para llamar al siguiente (Ctrl+C para salir)." % argumento)
    try:
        while True:
            input()
            respuesta = preguntar("LLAMAR " + argumento).split(" ")
            if respuesta[0] == "LLAMANDO":
                print("%sLlamando al turno %s: %s%s" % (VERDE, respuesta[1], respuesta[2], NORMAL))
            elif respuesta[0] == "VACIO":
                print(GRIS + "No hay nadie esperando." + NORMAL)
            else:
                print("El servidor dice:", " ".join(respuesta))
    except (KeyboardInterrupt, EOFError):
        pass

elif modo == "pantalla":
    if preguntar("PANTALLA") != "PANTALLA_OK":
        print("El servidor no ha aceptado la pantalla")
        sys.exit(1)
    llamadas = []    # las últimas llamadas
    try:
        while True:
            linea = lector.readline()
            if linea == "":
                print("Se ha cerrado la conexión con el servidor.")
                break
            partes = linea.strip().split(" ")
            if partes[0] == "LLAMANDO":
                llamadas.append((partes[1], partes[2], partes[4]))
                llamadas = llamadas[-5:]
                print("\033[2J\033[H", end="")    # borra la pantalla
                print(LILA + "=== SALA DE ESPERA ===" + NORMAL + "\n")
                turno, nombre, mostrador = llamadas[-1]
                print("%sTurno %s  %s  ->  Mostrador %s%s\n" % (VERDE, turno, nombre, mostrador, NORMAL))
                for turno, nombre, mostrador in reversed(llamadas[:-1]):
                    print("%sTurno %s  %s  (mostrador %s)%s" % (GRIS, turno, nombre, mostrador, NORMAL))
    except KeyboardInterrupt:
        pass

conexion.close()
