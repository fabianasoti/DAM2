# Pruebas del sistema de turnos. Arranca el servidor de verdad (puerto 5051) y hace de clientes.
# Uso (desde esta carpeta): python3 pruebas.py
import os
import re
import socket
import subprocess
import sys
import threading
import time

PROYECTO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "proyecto")
PUERTO = 5051


def conectar():
    c = socket.create_connection(("127.0.0.1", PUERTO), timeout=10)
    return c, c.makefile("r", encoding="utf-8")


def orden(c, lector, texto):
    c.sendall((texto + "\n").encode())
    return lector.readline().strip()


def informe(nombre, ok, detalle=""):
    print(("OK    " if ok else "FALLO ") + nombre + (" -> " + detalle if detalle else ""))


def pruebas():
    c, r = conectar()

    # 1. Funcionamiento básico
    informe("ESTADO con la sala vacía", orden(c, r, "ESTADO") == "ESPERANDO 0 ULTIMO 0", orden(c, r, "ESTADO"))
    informe("LLAMAR sin nadie esperando", orden(c, r, "LLAMAR 1") == "VACIO")
    informe("primer turno", orden(c, r, "PEDIR Ana") == "TURNO 1 DELANTE 0")
    informe("segundo turno, con una persona delante", orden(c, r, "PEDIR Luis") == "TURNO 2 DELANTE 1")

    pantalla, lector_pantalla = conectar()
    informe("la pantalla se registra", orden(pantalla, lector_pantalla, "PANTALLA") == "PANTALLA_OK")
    informe("se llama primero a quien llegó antes", orden(c, r, "LLAMAR 1") == "LLAMANDO 1 Ana")
    informe("la pantalla recibe el aviso", lector_pantalla.readline().strip() == "LLAMANDO 1 Ana MOSTRADOR 1")
    informe("ESTADO con una persona esperando", orden(c, r, "ESTADO") == "ESPERANDO 1 ULTIMO 2")

    # 2. Entradas no válidas
    informe("nombre con números", orden(c, r, "PEDIR Ana123").startswith("ERROR"), orden(c, r, "PEDIR Ana123"))
    informe("nombre de 21 letras", orden(c, r, "PEDIR " + "a" * 21).startswith("ERROR"))
    informe("nombre con inyección", orden(c, r, "PEDIR Ana;rm").startswith("ERROR"))
    informe("mostrador no numérico", orden(c, r, "LLAMAR abc").startswith("ERROR"))
    informe("orden desconocida", orden(c, r, "HOLA").startswith("ERROR"))
    informe("orden vacía", orden(c, r, "").startswith("ERROR"))
    c.sendall(b"\xff\xfe\n")
    informe("bytes que no son texto", r.readline().startswith("ERROR"))
    informe("los errores no consumen turnos", orden(c, r, "ESTADO") == "ESPERANDO 1 ULTIMO 2", orden(c, r, "ESTADO"))

    larga, lector_larga = conectar()
    larga.sendall(b"A" * 300)
    respuesta = lector_larga.readline().strip()
    cerrada = lector_larga.readline() == ""
    informe("línea de 300 bytes sin final: error y corte", respuesta.startswith("ERROR") and cerrada, respuesta)
    c.close()
    pantalla.close()
    time.sleep(0.3)

    # 3. Una pantalla que se cae no tumba al servidor
    caida, lector_caida = conectar()
    orden(caida, lector_caida, "PANTALLA")
    caida.close()
    c, r = conectar()
    orden(c, r, "PEDIR Marta")
    informe("tras caerse una pantalla, el servidor sigue", orden(c, r, "LLAMAR 1").startswith("LLAMANDO"))
    while orden(c, r, "LLAMAR 1") != "VACIO":
        pass    # vaciamos la cola
    c.close()

    # 4. Muchos clientes a la vez: ningún turno repetido
    TOTAL = 300
    turnos = []
    seguro = threading.Lock()

    def cliente(i):
        cc, rr = conectar()
        resp = orden(cc, rr, "PEDIR Cliente").split(" ")
        with seguro:
            turnos.append(int(resp[1]))
        cc.close()

    cb, rb = conectar()
    base = int(orden(cb, rb, "ESTADO").split(" ")[3])    # último turno repartido hasta ahora
    cb.close()
    hilos = [threading.Thread(target=cliente, args=(i,)) for i in range(TOTAL)]
    t0 = time.perf_counter()
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()
    t_pedir = time.perf_counter() - t0
    informe("%d clientes simultáneos piden turno" % TOTAL, len(set(turnos)) == TOTAL and min(turnos) == base + 1 and max(turnos) == base + TOTAL,
            "distintos=%d, del %d al %d, %.2f s" % (len(set(turnos)), min(turnos), max(turnos), t_pedir))

    # 5. Varios mostradores llamando a la vez, con una pantalla mirando
    pantalla, lector_pantalla = conectar()
    orden(pantalla, lector_pantalla, "PANTALLA")
    avisos = []

    def leer_pantalla():
        for linea in lector_pantalla:
            avisos.append(linea.strip())
            if len(avisos) == TOTAL:
                break

    hilo_pantalla = threading.Thread(target=leer_pantalla)
    hilo_pantalla.start()

    llamados = []

    def mostrador(numero):
        cc, rr = conectar()
        while True:
            resp = orden(cc, rr, "LLAMAR %d" % numero)
            if resp == "VACIO":
                break
            with seguro:
                llamados.append(int(resp.split(" ")[1]))
        cc.close()

    mostradores = [threading.Thread(target=mostrador, args=(n,)) for n in range(1, 5)]
    t0 = time.perf_counter()
    for h in mostradores:
        h.start()
    for h in mostradores:
        h.join()
    t_llamar = time.perf_counter() - t0
    hilo_pantalla.join(timeout=10)
    informe("4 mostradores llaman a la vez: cada turno una sola vez", sorted(llamados) == list(range(base + 1, base + TOTAL + 1)),
            "llamados=%d, %.2f s" % (len(llamados), t_llamar))
    bien_formados = all(re.fullmatch(r"LLAMANDO \d+ [A-Za-z]+ MOSTRADOR [1-4]", a) for a in avisos)
    informe("la pantalla recibe todos los avisos, sin mezclarse", len(avisos) == TOTAL and bien_formados, "avisos=%d" % len(avisos))
    pantalla.close()


def principal():
    servidor = subprocess.Popen([sys.executable, "servidor.py", str(PUERTO)], cwd=PROYECTO,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        pruebas()
    finally:
        servidor.kill()


principal()
