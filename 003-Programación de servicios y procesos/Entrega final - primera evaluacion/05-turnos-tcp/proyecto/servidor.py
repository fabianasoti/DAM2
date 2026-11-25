# Servidor del sistema de turnos (sala de espera)
# Protocolo de texto: cada orden es una línea que termina en salto de línea.
#   PEDIR nombre     -> TURNO numero DELANTE personas
#   LLAMAR mostrador -> LLAMANDO numero nombre   (o VACIO si no hay nadie)
#   PANTALLA         -> PANTALLA_OK y luego recibe un aviso cada vez que se llama a alguien
#   ESTADO           -> ESPERANDO personas ULTIMO numero
#   SALIR
import socket
import sys
import threading
from collections import deque

IP = "0.0.0.0"
PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 5050

MAX_LINEA = 100          # bytes máximos por orden
TIEMPO_INACTIVO = 300    # segundos sin actividad antes de cerrar la conexión

# Datos compartidos por todos los hilos: siempre se tocan con el candado
candado = threading.Lock()
candado_avisos = threading.Lock()    # los avisos a las pantallas se envían de uno en uno
cola = deque()      # personas esperando: (numero, nombre)
ultimo_turno = 0    # último número repartido
pantallas = []      # conexiones de las pantallas de la sala

servidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
servidor.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
servidor.bind((IP, PUERTO))
servidor.listen()


def enviar(conexion, texto):
    conexion.sendall((texto + "\n").encode("utf-8"))


def avisar_pantallas(texto):
    # Copiamos la lista con el candado y enviamos fuera de él, para no bloquear a los demás
    with candado_avisos:
        with candado:
            copia = list(pantallas)
        for pantalla in copia:
            try:
                enviar(pantalla, texto)
            except OSError:
                with candado:
                    if pantalla in pantallas:
                        pantallas.remove(pantalla)


def tratar_orden(conexion, linea):
    global ultimo_turno
    partes = linea.split(" ")
    orden = partes[0]

    if orden == "PEDIR" and len(partes) == 2:
        nombre = partes[1]
        # Solo letras, de 1 a 20 caracteres
        if not nombre.isalpha() or len(nombre) > 20:
            enviar(conexion, "ERROR nombre no valido (solo letras, de 1 a 20)")
            return
        with candado:                       # sección crítica: el contador es de todos
            ultimo_turno += 1
            numero = ultimo_turno
            delante = len(cola)
            cola.append((numero, nombre))
        enviar(conexion, "TURNO %d DELANTE %d" % (numero, delante))

    elif orden == "LLAMAR" and len(partes) == 2:
        if not partes[1].isdecimal() or len(partes[1]) > 2:
            enviar(conexion, "ERROR mostrador no valido (un numero de 1 o 2 cifras)")
            return
        with candado:
            siguiente = cola.popleft() if cola else None
        if siguiente is None:
            enviar(conexion, "VACIO")
            return
        numero, nombre = siguiente
        enviar(conexion, "LLAMANDO %d %s" % (numero, nombre))
        avisar_pantallas("LLAMANDO %d %s MOSTRADOR %s" % (numero, nombre, partes[1]))

    elif orden == "PANTALLA" and len(partes) == 1:
        enviar(conexion, "PANTALLA_OK")    # primero la confirmación, después se apunta a los avisos
        with candado:
            if conexion not in pantallas:
                pantallas.append(conexion)

    elif orden == "ESTADO" and len(partes) == 1:
        with candado:
            esperando = len(cola)
            ultimo = ultimo_turno
        enviar(conexion, "ESPERANDO %d ULTIMO %d" % (esperando, ultimo))

    else:
        enviar(conexion, "ERROR orden no reconocida")


def atender_cliente(conexion, direccion):
    print("Conectado:", direccion)
    conexion.settimeout(TIEMPO_INACTIVO)
    buffer = b""
    try:
        while True:
            datos = conexion.recv(1024)
            if not datos:
                break
            buffer += datos

            # Una orden sin final de línea que ya es demasiado larga: cortamos la conexión
            if b"\n" not in buffer and len(buffer) > MAX_LINEA:
                enviar(conexion, "ERROR linea demasiado larga")
                break

            while b"\n" in buffer:
                linea, buffer = buffer.split(b"\n", 1)
                if len(linea) > MAX_LINEA:
                    enviar(conexion, "ERROR linea demasiado larga")
                    return
                try:
                    texto = linea.decode("utf-8").strip()
                except UnicodeDecodeError:
                    enviar(conexion, "ERROR texto no valido")
                    continue
                if texto == "SALIR":
                    return
                tratar_orden(conexion, texto)

    except OSError:
        pass    # conexión cortada o tiempo agotado

    finally:
        with candado:
            if conexion in pantallas:
                pantallas.remove(conexion)
        conexion.close()
        print("Desconectado:", direccion)


print("Sala de espera escuchando en el puerto", PUERTO)

while True:
    conexion, direccion = servidor.accept()
    # Un hilo por cliente, para atender a todos a la vez
    hilo = threading.Thread(target=atender_cliente, args=(conexion, direccion), daemon=True)
    hilo.start()
