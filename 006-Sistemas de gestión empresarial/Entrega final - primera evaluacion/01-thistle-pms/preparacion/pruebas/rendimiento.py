# Mediciones de rendimiento de Thistle PMS con los datos de ejemplo (unas 5000 reservas).
# Copia el proyecto a una carpeta temporal, arranca PHP, mide el tiempo de varias peticiones
# y enseña el plan de ejecución (EXPLAIN QUERY PLAN) de las consultas clave.
#
# Uso: python3 rendimiento.py        (SQLITE_EXT=<sqlite3.so> si PHP no tiene SQLite)
import json
import os
import shutil
import signal
import socket
import sqlite3
import statistics
import subprocess
import sys
import tempfile
import time
import urllib.request
import http.cookiejar
from datetime import date, timedelta

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEN = os.path.join(AQUI, "..", "..", "proyecto")
PUERTO = 8094
BASE = "http://127.0.0.1:%d/" % PUERTO
REPETICIONES = 30


def pedir(opener, ruta, datos=None):
    cuerpo = json.dumps(datos).encode() if datos is not None else None
    cab = {"Content-Type": "application/json"} if datos is not None else {}
    t = time.perf_counter()
    with opener.open(urllib.request.Request(BASE + ruta, data=cuerpo, headers=cab), timeout=30) as r:
        texto = r.read()
    return (time.perf_counter() - t) * 1000, len(texto)


def main():
    carpeta = tempfile.mkdtemp(prefix="pms_rend_")
    shutil.copytree(ORIGEN, carpeta, dirs_exist_ok=True, ignore=shutil.ignore_patterns("thistle.db", "exportaciones"))
    ext = os.environ.get("SQLITE_EXT")
    orden = ["php"] + (["-d", "extension=" + ext] if ext else []) + ["-S", "127.0.0.1:%d" % PUERTO, "-t", carpeta]
    with socket.socket() as s:
        if s.connect_ex(("127.0.0.1", PUERTO)) == 0:
            sys.exit("Puerto ocupado")
    servidor = subprocess.Popen(orden, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    time.sleep(1.5)
    try:
        print("# %s" % time.strftime("%Y-%m-%d %H:%M"))
        print("# equipo: %s" % (subprocess.run("lscpu | grep 'Model name' | sed 's/.*: *//'", shell=True, capture_output=True, text=True).stdout.strip()))
        print("# PHP %s, SQLite %s, servidor integrado de PHP (un solo equipo, sin caché)" % (
            subprocess.run(["php", "-r", "echo PHP_VERSION;"], capture_output=True, text=True).stdout,
            sqlite3.sqlite_version))
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        t = time.perf_counter()
        pedir(opener, "api/sesion.php?accion=login", {"email": "sergio.molina@cardomarino.example", "password": "Thistle2026!"})
        print("primer login (incluye crear la base de datos con datos de ejemplo): %.0f ms" % ((time.perf_counter() - t) * 1000))

        hoy = date.today()
        entrada, salida = (hoy + timedelta(days=20)).isoformat(), (hoy + timedelta(days=23)).isoformat()
        peticiones = [
            ("disponibles (50 habitaciones, precio por noche y temporada)", "api/reservas.php?accion=disponibles&entrada=%s&salida=%s&huespedes=2" % (entrada, salida)),
            ("lista de reservas (300 filas, sin filtros)", "api/reservas.php?accion=lista"),
            ("lista de reservas filtrada por estado", "api/reservas.php?accion=lista&estado=check-in"),
            ("tablero (habitaciones, llegadas, salidas y calendario de 14 días)", "api/tablero.php?dias=14"),
            ("dashboard (12 meses, canales, tipos y próximos 14 días)", "api/kpis.php"),
            ("lista de clientes (400 filas)", "api/crud.php?entidad=clientes"),
        ]
        print("\n%d repeticiones por petición (milisegundos)\n" % REPETICIONES)
        print("| Petición | Mediana | Mínimo | Máximo | Tamaño |")
        print("|---|---|---|---|---|")
        for nombre, ruta in peticiones:
            pedir(opener, ruta)    # calentamiento
            tiempos, tam = [], 0
            for _ in range(REPETICIONES):
                ms, tam = pedir(opener, ruta)
                tiempos.append(ms)
            print("| %s | %.1f | %.1f | %.1f | %.0f KB |" % (nombre, statistics.median(tiempos), min(tiempos), max(tiempos), tam / 1024))

        # Plan de ejecución de las consultas clave
        c = sqlite3.connect(os.path.join(carpeta, "data", "thistle.db"))
        print("\n## Datos")
        for t_ in ("habitaciones", "clientes", "reservas", "mantenimiento"):
            print("- %s: %d filas" % (t_, c.execute("SELECT COUNT(*) FROM " + t_).fetchone()[0]))
        print("- tamaño de la base de datos: %.0f KB" % (os.path.getsize(os.path.join(carpeta, "data", "thistle.db")) / 1024))
        print("\n## EXPLAIN QUERY PLAN: ¿hay solape? (se ejecuta antes de cada reserva)")
        for fila in c.execute("EXPLAIN QUERY PLAN SELECT COUNT(*) FROM reservas WHERE habitacion_id = 1 AND estado <> 'cancelada' AND id <> 0 AND fecha_entrada < '2027-01-03' AND '2027-01-01' < fecha_salida"):
            print("  ", fila[3])
        print("\n## EXPLAIN QUERY PLAN: llegadas de hoy")
        for fila in c.execute("EXPLAIN QUERY PLAN SELECT COUNT(*) FROM reservas WHERE estado = 'confirmada' AND fecha_entrada = '2026-12-01'"):
            print("  ", fila[3])
        # Sin el índice, ¿cuánto tardaría la consulta de solape?
        def tiempo_solape():
            t0 = time.perf_counter()
            for h in range(1, 51):
                c.execute("SELECT COUNT(*) FROM reservas WHERE habitacion_id = ? AND estado <> 'cancelada' AND fecha_entrada < '2027-01-03' AND '2027-01-01' < fecha_salida", (h,)).fetchone()
            return (time.perf_counter() - t0) * 1000
        con = min(tiempo_solape() for _ in range(5))
        c.execute("DROP INDEX idx_reservas_habitacion")
        sin = min(tiempo_solape() for _ in range(5))
        print("\n## Efecto del índice idx_reservas_habitacion (50 comprobaciones de solape seguidas, mejor de 5)")
        print("- con índice: %.2f ms" % con)
        print("- sin índice: %.2f ms" % sin)
        c.close()
    finally:
        os.killpg(servidor.pid, signal.SIGTERM)
        shutil.rmtree(carpeta, ignore_errors=True)


main()
