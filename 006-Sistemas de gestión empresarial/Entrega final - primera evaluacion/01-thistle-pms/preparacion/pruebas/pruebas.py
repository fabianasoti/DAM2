# Pruebas de la API de Thistle PMS.
# Copia el proyecto a una carpeta temporal, arranca el servidor de PHP y hace de cliente.
# Los resultados se comprueban de forma independiente leyendo la base de datos con Python.
#
# Uso (desde esta carpeta):   python3 pruebas.py
# Si PHP no tiene SQLite, indica la extensión:  SQLITE_EXT=/ruta/sqlite3.so python3 pruebas.py
import http.cookiejar
import json
import os
import signal
import socket
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from datetime import date, timedelta

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEN = os.path.join(AQUI, "..", "..", "proyecto")
PUERTO = 8091
BASE = "http://127.0.0.1:%d/" % PUERTO
CLAVE = "Thistle2026!"
ADMIN = "lucia.ferrer@cardomarino.example"
RECEPCION = "sergio.molina@cardomarino.example"
RECEPCION2 = "irene.campos@cardomarino.example"
MANTENIMIENTO = "pablo.navarro@cardomarino.example"
LIMPIEZA = "rosa.delgado@cardomarino.example"
HOY = date.today()

resultados = {"ok": 0, "fallo": 0}


def informe(nombre, condicion, detalle=""):
    resultados["ok" if condicion else "fallo"] += 1
    print(("OK    " if condicion else "FALLO ") + nombre + ((" -> " + str(detalle)) if detalle != "" else ""))


class Cliente:
    """Un navegador: guarda su cookie de sesión."""
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def pedir(self, ruta, datos=None, tipo="application/json", metodo=None):
        cuerpo = None
        cabeceras = {}
        if datos is not None:
            cuerpo = datos.encode() if isinstance(datos, str) else json.dumps(datos).encode()
            cabeceras["Content-Type"] = tipo
        peticion = urllib.request.Request(BASE + ruta, data=cuerpo, headers=cabeceras, method=metodo)
        try:
            with self.opener.open(peticion, timeout=30) as r:
                return r.status, r.read().decode(), r.headers
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode(), e.headers

    def json(self, ruta, datos=None, **kw):
        codigo, texto, _ = self.pedir(ruta, datos, **kw)
        try:
            return codigo, json.loads(texto)
        except ValueError:
            return codigo, {"ok": False, "error": "respuesta no JSON: " + texto[:80]}

    def entrar(self, email, clave=CLAVE):
        return self.json("api/sesion.php?accion=login", {"email": email, "password": clave})


def sesion(email):
    c = Cliente()
    codigo, r = c.entrar(email)
    assert codigo == 200, (email, codigo, r)
    return c


def bd(carpeta):
    c = sqlite3.connect(os.path.join(carpeta, "data", "thistle.db"))
    c.row_factory = sqlite3.Row
    return c


def sumar(f, n):
    return (f + timedelta(days=n)).isoformat()


def preparar_habitacion(carpeta, id_habitacion, desde, hasta):
    """Deja libre una habitación entre dos fechas: cancela, directamente en la base de datos,
    las reservas que se pisen. Así cada prueba parte de un escenario conocido."""
    w = bd(carpeta)
    w.execute("""UPDATE reservas SET estado = 'cancelada' WHERE habitacion_id = ? AND estado <> 'cancelada'
        AND fecha_entrada < ? AND ? < fecha_salida""", (id_habitacion, hasta, desde))
    w.commit()
    w.close()
    return id_habitacion


def importe_esperado(c, habitacion_id, entrada, salida):
    """Precio calculado aparte, noche a noche, con las temporadas de la base de datos."""
    precio = c.execute("SELECT precio_noche FROM habitaciones WHERE id = ?", (habitacion_id,)).fetchone()[0]
    temporadas = c.execute("SELECT fecha_inicio, fecha_fin, multiplicador FROM temporadas").fetchall()
    total = 0.0
    d = date.fromisoformat(entrada)
    while d < date.fromisoformat(salida):
        m = 1.0
        for t in temporadas:
            if t[0] <= d.isoformat() <= t[1]:
                m = t[2]
        total += round(precio * m, 2)
        d += timedelta(days=1)
    return round(total, 2)


def main():
    carpeta = tempfile.mkdtemp(prefix="pms_pruebas_")
    shutil.copytree(ORIGEN, carpeta, dirs_exist_ok=True, ignore=shutil.ignore_patterns("thistle.db", "exportaciones"))
    ext = os.environ.get("SQLITE_EXT")
    orden = ["php"] + (["-d", "extension=" + ext] if ext else []) + ["-S", "127.0.0.1:%d" % PUERTO, "-t", carpeta]
    env = dict(os.environ, PHP_CLI_SERVER_WORKERS="8")
    # El puerto tiene que estar libre: si no, hablaríamos con un servidor antiguo
    with socket.socket() as prueba:
        if prueba.connect_ex(("127.0.0.1", PUERTO)) == 0:
            sys.exit("El puerto %d ya está en uso: cierra el servidor anterior" % PUERTO)
    # start_new_session crea un grupo de procesos propio: así se cierran también los procesos hijos del servidor
    servidor = subprocess.Popen(orden, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env, start_new_session=True)
    time.sleep(1.5)
    try:
        pruebas(carpeta, orden[:-4])
    finally:
        os.killpg(servidor.pid, signal.SIGTERM)
        shutil.rmtree(carpeta, ignore_errors=True)
    print("\nResumen: %d correctas, %d con fallo" % (resultados["ok"], resultados["fallo"]))
    sys.exit(1 if resultados["fallo"] else 0)


def pruebas(carpeta, php):
    anonimo = Cliente()

    # ---------------- 1. Instalación automática y datos ----------------
    informe("la base de datos no existe antes del primer uso", not os.path.exists(os.path.join(carpeta, "data", "thistle.db")))
    codigo, r = anonimo.json("api/sesion.php?accion=yo")
    informe("sin sesión, /yo responde 401", codigo == 401, codigo)
    admin = sesion(ADMIN)
    informe("al primer login se instala sola la base de datos", os.path.exists(os.path.join(carpeta, "data", "thistle.db")))
    c = bd(carpeta)
    cuenta = lambda t: c.execute("SELECT COUNT(*) FROM " + t).fetchone()[0]
    informe("datos de ejemplo", cuenta("habitaciones") == 50 and cuenta("clientes") == 400 and cuenta("usuarios") == 6 and cuenta("temporadas") == 21,
            "habitaciones=%d clientes=%d reservas=%d" % (cuenta("habitaciones"), cuenta("clientes"), cuenta("reservas")))
    solapes = c.execute("""SELECT COUNT(*) FROM reservas a JOIN reservas b ON a.habitacion_id = b.habitacion_id AND a.id < b.id
        AND a.estado <> 'cancelada' AND b.estado <> 'cancelada' AND a.fecha_entrada < b.fecha_salida AND b.fecha_entrada < a.fecha_salida""").fetchone()[0]
    informe("los datos de ejemplo no tienen reservas solapadas", solapes == 0, solapes)
    inc = c.execute("""SELECT COUNT(*) FROM habitaciones h WHERE h.estado = 'ocupada' AND
        (SELECT COUNT(*) FROM reservas r WHERE r.habitacion_id = h.id AND r.estado = 'check-in') <> 1""").fetchone()[0]
    informe("cada habitación ocupada tiene exactamente un huésped en check-in", inc == 0, inc)
    informe("las contraseñas están cifradas (no en texto plano)",
            all(f[0].startswith("$2y$") and CLAVE not in f[0] for f in c.execute("SELECT password_hash FROM usuarios")))
    informe("estados de las habitaciones", {f[0] for f in c.execute("SELECT DISTINCT estado FROM habitaciones")} == {"disponible", "ocupada", "sucia", "mantenimiento"})

    # ---------------- 2. Seguridad: acceso, roles y sesiones ----------------
    rutas = ["api/reservas.php", "api/tablero.php", "api/kpis.php", "api/mantenimiento.php", "api/crud.php?entidad=clientes",
             "servicios/salida.php?tabla=clientes"]
    codigos = [anonimo.json(r)[0] for r in rutas]
    informe("sin sesión, todos los servicios responden 401", set(codigos) == {401}, codigos)
    codigo, r = anonimo.entrar(ADMIN, "mala")
    informe("contraseña incorrecta: 401 y mensaje genérico", codigo == 401 and r["error"] == "Credenciales incorrectas", r.get("error"))
    codigo, r = anonimo.entrar("no.existe@cardomarino.example", "lo-que-sea")
    informe("usuario inexistente: mismo mensaje (no revela qué emails existen)", codigo == 401 and r["error"] == "Credenciales incorrectas")
    codigo, texto, _ = anonimo.pedir("api/sesion.php?accion=login", '{"email": "x", "password": "y"}', tipo="text/plain")
    informe("las peticiones que no son JSON se rechazan (protección CSRF)", codigo == 415, codigo)
    # La cookie se fija en el login; la comprobamos pidiendo otro login
    otro = Cliente()
    _, _, cab_login = otro.pedir("api/sesion.php?accion=login", {"email": RECEPCION, "password": CLAVE})
    set_cookie = " ".join(v for k, v in cab_login.items() if k.lower() == "set-cookie")
    informe("la cookie se envía con HttpOnly y SameSite=Strict", "HttpOnly" in set_cookie and "SameSite=Strict" in set_cookie, set_cookie[:90])
    lista_usuarios = admin.pedir("api/crud.php?entidad=usuarios")[1]
    informe("la lista de usuarios no contiene el hash ni la columna de contraseña", "password_hash" not in lista_usuarios and "$2y$" not in lista_usuarios)

    recepcion, limpieza, mantenimiento = sesion(RECEPCION), sesion(LIMPIEZA), sesion(MANTENIMIENTO)
    informe("limpieza no puede ver reservas", limpieza.json("api/reservas.php")[0] == 403)
    informe("mantenimiento no puede ver el dashboard", mantenimiento.json("api/kpis.php")[0] == 403)
    informe("recepción no puede ver usuarios", recepcion.json("api/crud.php?entidad=usuarios")[0] == 403)
    informe("recepción no puede ver la auditoría", recepcion.json("api/crud.php?entidad=auditoria")[0] == 403)
    informe("recepción no puede crear habitaciones", recepcion.json("api/crud.php?accion=guardar", {"entidad": "habitaciones",
            "datos": {"numero": "999", "planta": 9, "tipo": "Doble", "capacidad": 2, "precio_noche": 90}})[0] == 403)
    informe("una entidad inexistente da 404 (no se puede consultar cualquier tabla)", admin.json("api/crud.php?entidad=sqlite_master")[0] == 404)
    informe("limpieza no puede exportar clientes", limpieza.json("servicios/salida.php?tabla=clientes")[0] == 403)
    t = limpieza.json("api/tablero.php")[1]
    informe("limpieza ve las habitaciones pero no los nombres de huéspedes", len(t["habitaciones"]) == 50 and "huesped" not in t["habitaciones"][0] and t["llegadas"] == [])
    t = recepcion.json("api/tablero.php")[1]
    informe("recepción sí ve huéspedes y llegadas", any(h.get("huesped") for h in t["habitaciones"]) and len(t["llegadas"]) > 0)

    # Bloqueo por intentos fallidos (con otro usuario, para no bloquear a los demás)
    intruso = Cliente()
    for _ in range(5):
        intruso.entrar(RECEPCION2, "mala")
    codigo, r = intruso.entrar(RECEPCION2, CLAVE)
    informe("tras 5 intentos fallidos, se bloquea el acceso aunque la contraseña sea correcta", codigo == 429, r.get("error"))
    informe("el bloqueo no afecta a otros usuarios", Cliente().entrar(RECEPCION)[0] == 200)
    acciones = {f[0] for f in c.execute("SELECT accion FROM auditoria")}
    informe("la auditoría registra login, login fallido y bloqueo", {"login", "login fallido", "login bloqueado"} <= acciones, sorted(acciones))

    # ---------------- 3. Reservas: validaciones ----------------
    manana, pasado = sumar(HOY, 1), sumar(HOY, 2)
    # Habitaciones disponibles que usan las pruebas (cada una para un escenario distinto)
    candidatas = [f[0] for f in c.execute("SELECT id FROM habitaciones WHERE estado = 'disponible' ORDER BY id")]
    hab = preparar_habitacion(carpeta, candidatas[0], sumar(HOY, 19), sumar(HOY, 31))
    libre_check = candidatas[1]
    cliente = c.execute("SELECT id FROM clientes ORDER BY id LIMIT 1").fetchone()[0]
    base = {"habitacion_id": hab, "cliente_id": cliente, "fecha_entrada": sumar(HOY, 20), "fecha_salida": sumar(HOY, 23), "num_huespedes": 1, "canal": "web"}

    def crear(**cambios):
        return recepcion.json("api/reservas.php?accion=crear", dict(base, **cambios))

    informe("salida anterior a la entrada se rechaza", crear(fecha_salida=sumar(HOY, 19))[1].get("error") == "La salida debe ser posterior a la entrada")
    informe("salida igual a la entrada se rechaza", crear(fecha_salida=sumar(HOY, 20))[0] == 400)
    informe("entrada en el pasado se rechaza", crear(fecha_entrada=sumar(HOY, -1), fecha_salida=sumar(HOY, 2))[1].get("error") == "La fecha de entrada no puede ser anterior a hoy")
    informe("fecha inexistente (30 de febrero) se rechaza", crear(fecha_entrada="2027-02-30", fecha_salida="2027-03-02")[0] == 400)
    informe("estancia de más de 30 noches se rechaza", crear(fecha_salida=sumar(HOY, 60))[0] == 400)
    informe("canal inventado se rechaza", crear(canal="telepatia")[0] == 400)
    informe("más huéspedes que la capacidad se rechaza", crear(num_huespedes=6)[0] == 409)
    informe("cliente inexistente se rechaza", crear(cliente_id=99999)[0] == 404)
    informe("habitación inexistente se rechaza", crear(habitacion_id=99999)[0] == 404)
    informe("un rol sin permiso (limpieza) no puede reservar", limpieza.json("api/reservas.php?accion=crear", base)[0] == 403)

    # ---------------- 4. Reservas: crear, precio y solapes ----------------
    codigo, r = crear()
    informe("reserva correcta", codigo == 201 and r["ok"], r)
    reserva_id = r.get("id")
    esperado = importe_esperado(c, hab, base["fecha_entrada"], base["fecha_salida"])
    informe("el importe coincide con el cálculo independiente por temporadas", abs(r.get("importe", 0) - esperado) < 0.005, "%s frente a %s" % (r.get("importe"), esperado))
    guardado = c.execute("SELECT importe_total, estado FROM reservas WHERE id = ?", (reserva_id,)).fetchone()
    informe("queda guardada como confirmada con su importe", guardado and guardado[1] == "confirmada" and abs(guardado[0] - esperado) < 0.005)

    codigo, r = crear()
    informe("la misma habitación y fechas: rechazada", codigo == 409 and "ya está reservada" in r["error"], r.get("error"))
    informe("fechas que se pisan solo en parte (entrada dentro de la estancia): rechazada", crear(fecha_entrada=sumar(HOY, 22), fecha_salida=sumar(HOY, 25))[0] == 409)
    informe("fechas que envuelven a la reserva existente: rechazada", crear(fecha_entrada=sumar(HOY, 19), fecha_salida=sumar(HOY, 26))[0] == 409)
    informe("reservar justo al terminar otra (salida = entrada) sí se permite", crear(fecha_entrada=sumar(HOY, 23), fecha_salida=sumar(HOY, 25))[0] == 201)
    codigo, r = recepcion.json("api/reservas.php?accion=disponibles&entrada=%s&salida=%s&huespedes=1" % (sumar(HOY, 20), sumar(HOY, 23)))
    informe("la habitación reservada ya no aparece como disponible", codigo == 200 and hab not in [h["id"] for h in r["habitaciones"]])
    informe("las habitaciones disponibles traen su precio calculado",
            all("importe" in h for h in r["habitaciones"]) and r["noches"] == 3, len(r["habitaciones"]))
    informe("sin solapes tras todas las pruebas (comprobado en la base de datos)", c.execute("""SELECT COUNT(*) FROM reservas a JOIN reservas b ON a.habitacion_id = b.habitacion_id AND a.id < b.id
        AND a.estado <> 'cancelada' AND b.estado <> 'cancelada' AND a.fecha_entrada < b.fecha_salida AND b.fecha_entrada < a.fecha_salida""").fetchone()[0] == 0)

    # La base de datos se defiende sola, aunque se salte la API
    escritura = bd(carpeta)
    try:
        escritura.execute("INSERT INTO reservas (habitacion_id, cliente_id, fecha_entrada, fecha_salida) VALUES (?, ?, ?, ?)",
                          (hab, cliente, sumar(HOY, 21), sumar(HOY, 22)))
        escritura.commit()
        informe("el disparador de la base de datos impide un solape (sin pasar por PHP)", False)
    except sqlite3.DatabaseError as e:
        informe("el disparador de la base de datos impide un solape (sin pasar por PHP)", "ya está reservada" in str(e), str(e))
    try:
        escritura.execute("INSERT INTO reservas (habitacion_id, cliente_id, fecha_entrada, fecha_salida) VALUES (?, ?, ?, ?)",
                          (libre_check, cliente, sumar(HOY, 25), sumar(HOY, 25)))
        informe("la restricción CHECK impide salida igual a entrada", False)
    except sqlite3.IntegrityError:
        informe("la restricción CHECK impide salida igual a entrada", True)
    escritura.close()

    # Concurrencia: 12 recepcionistas reservan a la vez la misma habitación
    otra = preparar_habitacion(carpeta, candidatas[2], sumar(HOY, 39), sumar(HOY, 44))
    peticion = dict(base, habitacion_id=otra, fecha_entrada=sumar(HOY, 40), fecha_salida=sumar(HOY, 43))
    codigos = []
    clientes = [sesion(RECEPCION) for _ in range(12)]

    def lanzar(cl):
        codigos.append(cl.json("api/reservas.php?accion=crear", peticion)[0])

    hilos = [threading.Thread(target=lanzar, args=(cl,)) for cl in clientes]
    t0 = time.perf_counter()
    [h.start() for h in hilos]
    [h.join() for h in hilos]
    informe("12 reservas simultáneas de la misma habitación: solo una se acepta", sorted(codigos).count(201) == 1 and sorted(codigos).count(409) == 11,
            "%s en %.2f s" % (sorted(codigos), time.perf_counter() - t0))
    informe("en la base de datos queda exactamente una", c.execute("SELECT COUNT(*) FROM reservas WHERE habitacion_id = ? AND fecha_entrada = ?", (otra, sumar(HOY, 40))).fetchone()[0] == 1)

    # ---------------- 5. Flujo de recepción: check-in, check-out, cancelar ----------------
    hf = preparar_habitacion(carpeta, candidatas[3], sumar(HOY, -1), sumar(HOY, 5))
    codigo, r = recepcion.json("api/reservas.php?accion=crear", dict(base, habitacion_id=hf, fecha_entrada=HOY.isoformat(), fecha_salida=sumar(HOY, 3)))
    informe("reserva con llegada hoy", codigo == 201, r)
    rid = r["id"]
    estado = lambda i, e: recepcion.json("api/reservas.php?accion=estado", {"id": i, "estado": e})
    codigo, r = estado(reserva_id, "check-in")
    informe("check-in antes del día de entrada: rechazado", codigo == 409 and "Todavía no es el día" in r["error"], r.get("error"))
    codigo, r = estado(rid, "check-out")
    informe("check-out sin haber hecho check-in: rechazado", codigo == 409 and "No se puede pasar" in r["error"], r.get("error"))
    codigo, r = estado(rid, "check-in")
    informe("check-in correcto: la habitación pasa a ocupada", codigo == 200 and r["estado_habitacion"] == "ocupada", r)
    informe("segundo check-in: rechazado", estado(rid, "check-in")[0] == 409)
    informe("no se puede cancelar una reserva con check-in", estado(rid, "cancelada")[0] == 409)
    codigo, r = estado(rid, "check-out")
    informe("check-out: la habitación pasa a sucia", codigo == 200 and r["estado_habitacion"] == "sucia", r)
    nuevo = c.execute("SELECT fecha_salida, importe_total FROM reservas WHERE id = ?", (rid,)).fetchone()
    informe("salida anticipada: la estancia se acorta y se recalcula el importe", nuevo[0] == sumar(HOY, 1) and abs(nuevo[1] - importe_esperado(c, hf, HOY.isoformat(), sumar(HOY, 1))) < 0.005, tuple(nuevo))
    parte = c.execute("SELECT id, estado FROM mantenimiento WHERE habitacion_id = ? AND tipo = 'limpieza' AND estado <> 'resuelto'", (hf,)).fetchall()
    informe("el check-out crea un parte de limpieza pendiente", len(parte) == 1)
    codigo, r = estado(reserva_id, "cancelada")
    informe("cancelar una reserva confirmada", codigo == 200)
    informe("una reserva cancelada no se puede cancelar de nuevo", estado(reserva_id, "cancelada")[0] == 409)
    informe("al cancelar, esas fechas vuelven a estar disponibles", crear()[0] == 201)

    # Escenarios para probar las reglas del check-in (se preparan directamente en la base de datos)
    siguiente = iter(candidatas[4:])

    def escenario(estado_hab):
        h = preparar_habitacion(carpeta, next(siguiente), sumar(HOY, -1), sumar(HOY, 5))
        w = bd(carpeta)
        w.execute("UPDATE habitaciones SET estado = ? WHERE id = ?", (estado_hab, h))
        w.execute("INSERT INTO reservas (habitacion_id, cliente_id, fecha_entrada, fecha_salida, importe_total) VALUES (?, ?, ?, ?, 100)", (h, cliente, HOY.isoformat(), sumar(HOY, 2)))
        w.commit()
        rid_ = w.execute("SELECT MAX(id) FROM reservas").fetchone()[0]
        w.close()
        return rid_

    for estado_hab, texto in (("sucia", "está sucia"), ("mantenimiento", "en mantenimiento"), ("ocupada", "sigue ocupada")):
        codigo, r = estado(escenario(estado_hab), "check-in")
        informe("check-in con la habitación '%s': rechazado" % estado_hab, codigo == 409 and texto in r["error"], r.get("error"))

    # ---------------- 6. Mantenimiento y limpieza ----------------
    parte_id = parte[0][0]
    informe("mantenimiento no puede resolver un parte de limpieza", mantenimiento.json("api/mantenimiento.php?accion=resolver", {"id": parte_id})[0] == 403)
    informe("limpieza no puede ver las averías", limpieza.json("api/mantenimiento.php?tipo=averia")[0] == 403)
    codigo, r = limpieza.json("api/mantenimiento.php?accion=resolver", {"id": parte_id})
    informe("limpieza resuelve su parte: la habitación vuelve a disponible", codigo == 200 and r["estado_habitacion"] == "disponible", r)
    informe("un parte resuelto no se puede resolver otra vez", limpieza.json("api/mantenimiento.php?accion=resolver", {"id": parte_id})[0] == 409)

    h_aver = preparar_habitacion(carpeta, next(siguiente), sumar(HOY, -1), sumar(HOY, 5))
    codigo, r = recepcion.json("api/mantenimiento.php?accion=crear", {"habitacion_id": h_aver, "descripcion": "Fuga en el lavabo", "prioridad": "urgente"})
    informe("avería urgente: la habitación pasa a mantenimiento", codigo == 201 and r["estado_habitacion"] == "mantenimiento", r)
    codigo, r = recepcion.json("api/reservas.php?accion=disponibles&entrada=%s&salida=%s&huespedes=1" % (manana, pasado))
    informe("una habitación en mantenimiento no se ofrece como disponible", h_aver not in [h["id"] for h in r["habitaciones"]])
    informe("no se puede reservar una habitación bloqueada por avería", recepcion.json("api/reservas.php?accion=crear", dict(base, habitacion_id=h_aver, fecha_entrada=manana, fecha_salida=pasado))[0] == 409)
    aver_id = c.execute("SELECT MAX(id) FROM mantenimiento").fetchone()[0]
    informe("recepción no puede resolver averías", recepcion.json("api/mantenimiento.php?accion=resolver", {"id": aver_id})[0] == 403)
    informe("mantenimiento se asigna el parte", mantenimiento.json("api/mantenimiento.php?accion=asignar", {"id": aver_id})[0] == 200)
    codigo, r = mantenimiento.json("api/mantenimiento.php?accion=resolver", {"id": aver_id})
    informe("mantenimiento resuelve: la habitación vuelve a disponible", codigo == 200 and r["estado_habitacion"] == "disponible", r)
    informe("avería con prioridad baja no bloquea la habitación",
            recepcion.json("api/mantenimiento.php?accion=crear", {"habitacion_id": h_aver, "descripcion": "Bombilla", "prioridad": "baja"})[1]["estado_habitacion"] == "disponible")
    informe("descripción vacía se rechaza", recepcion.json("api/mantenimiento.php?accion=crear", {"habitacion_id": h_aver, "descripcion": " ", "prioridad": "baja"})[0] == 400)

    # ---------------- 7. Dashboard: se compara con un cálculo independiente ----------------
    codigo, k = admin.json("api/kpis.php")
    informe("el dashboard responde", codigo == 200 and len(k["mensual"]) == 12 and len(k["proximos"]) == 14)
    ok_meses = True
    detalle_meses = []
    reservas = c.execute("SELECT habitacion_id, fecha_entrada, fecha_salida, importe_total FROM reservas WHERE estado <> 'cancelada'").fetchall()
    for m in k["mensual"]:
        ini = date.fromisoformat(m["mes"])
        fin = date(ini.year + (ini.month == 12), ini.month % 12 + 1, 1)
        noches, ingresos = 0, 0.0
        for r_ in reservas:
            e, s = date.fromisoformat(r_[1]), date.fromisoformat(r_[2])
            n = (min(s, fin) - max(e, ini)).days
            if n > 0:
                noches += n
                ingresos += n * r_[3] / (s - e).days
        if m["noches"] != noches or abs(m["ingresos"] - ingresos) > 0.02:
            ok_meses = False
        detalle_meses.append((m["mes"], m["noches"], noches))
    informe("noches e ingresos de los 12 meses coinciden con el cálculo independiente", ok_meses, detalle_meses[-2:])
    ult = k["mensual"][-1]
    informe("ocupación, ADR y RevPAR son coherentes (RevPAR = ocupación x ADR)", abs(ult["revpar"] - ult["ocupacion"] / 100 * ult["adr"]) < 0.05,
            "%s %% x %s = %s" % (ult["ocupacion"], ult["adr"], ult["revpar"]))
    estados = {f[0]: f[1] for f in c.execute("SELECT estado, COUNT(*) FROM habitaciones GROUP BY estado")}
    informe("las habitaciones por estado coinciden con la base de datos", all(k["ahora"]["estados"][e] == estados.get(e, 0) for e in k["ahora"]["estados"]))
    informe("canales: la suma de reservas coincide con la base de datos",
            sum(x["reservas"] for x in k["canales"]) == c.execute("SELECT COUNT(*) FROM reservas WHERE estado <> 'cancelada' AND fecha_entrada >= date('now','localtime','-12 months') AND fecha_entrada <= date('now','localtime')").fetchone()[0])

    # ---------------- 8. Gestión de entidades (CRUD) ----------------
    guardar = lambda cl, entidad, datos, id=None: cl.json("api/crud.php?accion=guardar", {"entidad": entidad, "id": id, "datos": datos} if id else {"entidad": entidad, "datos": datos})
    codigo, r = guardar(recepcion, "clientes", {"nombre": "Prueba", "apellidos": "Datos", "dni_pasaporte": "ZZ9999991", "email": "prueba@example.com", "pais": "España"})
    informe("crear un cliente", codigo == 200 and r["ok"], r)
    nuevo_id = r.get("id")
    informe("documento repetido: error entendible", "Ya existe" in guardar(recepcion, "clientes", {"nombre": "Otro", "apellidos": "X", "dni_pasaporte": "ZZ9999991", "pais": "España"})[1].get("error", ""))
    informe("email no válido se rechaza", guardar(recepcion, "clientes", {"nombre": "A", "apellidos": "B", "dni_pasaporte": "ZZ9999992", "email": "esto-no-es-un-email", "pais": "España"})[0] == 400)
    informe("campo obligatorio vacío se rechaza", guardar(recepcion, "clientes", {"nombre": "", "apellidos": "B", "dni_pasaporte": "ZZ9999993", "pais": "España"})[0] == 400)
    informe("inyección SQL en un campo se guarda como texto, sin efecto", guardar(recepcion, "clientes", {"nombre": "x'); DROP TABLE clientes;--", "apellidos": "B", "dni_pasaporte": "ZZ9999994", "pais": "España"})[0] == 200 and cuenta("clientes") > 400)
    informe("editar solo cambia lo enviado", guardar(recepcion, "clientes", {"telefono": "+34 600 000 111"}, nuevo_id)[0] == 200
            and c.execute("SELECT nombre, telefono FROM clientes WHERE id = ?", (nuevo_id,)).fetchone()[:] == ("Prueba", "+34 600 000 111"))
    informe("recepción no puede borrar clientes", recepcion.json("api/crud.php?accion=borrar", {"entidad": "clientes", "id": nuevo_id})[0] == 403)
    codigo, r = admin.json("api/crud.php?accion=borrar", {"entidad": "clientes", "id": cliente})
    informe("no se borra un cliente con reservas (integridad referencial)", codigo == 400 and "datos relacionados" in r["error"], r.get("error"))
    informe("admin borra un cliente sin reservas", admin.json("api/crud.php?accion=borrar", {"entidad": "clientes", "id": nuevo_id})[0] == 200)
    codigo, r = guardar(admin, "usuarios", {"nombre": "Nuevo Usuario", "email": "nuevo@cardomarino.example", "rol": "limpieza", "activo": "1", "password": "corta"})
    informe("contraseña de menos de 8 caracteres se rechaza", codigo == 400)
    codigo, r = guardar(admin, "usuarios", {"nombre": "Nuevo Usuario", "email": "nuevo@cardomarino.example", "rol": "limpieza", "activo": "1", "password": "OtraClave-2026"})
    informe("admin crea un usuario con contraseña", codigo == 200)
    informe("el usuario nuevo puede entrar y su contraseña se guardó cifrada", Cliente().entrar("nuevo@cardomarino.example", "OtraClave-2026")[0] == 200
            and c.execute("SELECT password_hash FROM usuarios WHERE email = 'nuevo@cardomarino.example'").fetchone()[0].startswith("$2y$"))
    yo = c.execute("SELECT id FROM usuarios WHERE email = ?", (ADMIN,)).fetchone()[0]
    informe("el admin no puede borrarse a sí mismo", admin.json("api/crud.php?accion=borrar", {"entidad": "usuarios", "id": yo})[0] == 400)
    informe("el admin no puede quitarse el rol", guardar(admin, "usuarios", {"rol": "recepcion"}, yo)[0] == 400)
    informe("un usuario desactivado ya no puede entrar", (lambda: (guardar(admin, "usuarios", {"activo": "0"}, c.execute("SELECT id FROM usuarios WHERE email='nuevo@cardomarino.example'").fetchone()[0]),
                                                                  Cliente().entrar("nuevo@cardomarino.example", "OtraClave-2026")[0])[1] == 401)())

    # ---------------- 9. Servicios de entrada y salida ----------------
    codigo, texto, cab = recepcion.pedir("servicios/salida.php?tabla=reservas&formato=csv")
    lineas = texto.lstrip("﻿").split("\n")
    informe("exportar reservas a CSV", codigo == 200 and lineas[0].startswith("id;habitacion_id") and len(lineas) > 4000, "%d líneas" % len(lineas))
    codigo, texto, _ = admin.pedir("servicios/salida.php?tabla=usuarios&formato=json")
    informe("exportar usuarios no incluye las contraseñas cifradas", codigo == 200 and "password" not in texto and "$2y$" not in texto)
    w = bd(carpeta)
    w.execute("UPDATE clientes SET nombre = '=HYPERLINK(\"http://malo.example\")' WHERE id = 5")
    w.commit()
    w.close()
    informe("una celda que empieza por = se protege como texto en el CSV", "'=HYPERLINK" in recepcion.pedir("servicios/salida.php?tabla=clientes&formato=csv")[1])
    informe("tabla no permitida en la exportación", admin.json("servicios/salida.php?tabla=sqlite_master")[0] == 404)

    csv = "nombre;apellidos;dni_pasaporte;telefono;email;pais\nAda;Prueba Uno;ZZ8000001;;ada@example.com;España\n;Sin Nombre;ZZ8000002;;;España\nBea;Repetida;ZZ8000001;;;España\nCarla;Mal Email;ZZ8000003;;no-es-email;España\nDiego;Prueba Dos;ZZ8000004;;;Italia\n"
    codigo, r = recepcion.json("servicios/entrada.php", {"csv": csv})
    informe("importar clientes: 2 válidos y 3 rechazados con su motivo", codigo == 200 and r["insertados"] == 2 and len(r["rechazados"]) == 3, r)
    informe("importar un archivo sin columnas obligatorias se rechaza", recepcion.json("servicios/entrada.php", {"csv": "a;b\n1;2"})[0] == 400)
    informe("limpieza no puede importar clientes", limpieza.json("servicios/entrada.php", {"csv": csv})[0] == 403)

    # ---------------- 10. Exportación programada (línea de comandos) ----------------
    salida = subprocess.run(php + [os.path.join(carpeta, "servicios", "exportar_programado.php")], capture_output=True, text=True)
    archivos = os.listdir(os.path.join(carpeta, "data", "exportaciones")) if os.path.isdir(os.path.join(carpeta, "data", "exportaciones")) else []
    json_completo = [a for a in archivos if a.endswith("_completo.json")]
    informe("la exportación programada crea CSV por tabla, JSON completo y log", salida.returncode == 0 and "log.txt" in archivos and len(json_completo) == 1
            and len([a for a in archivos if a.endswith(".csv")]) >= 7, salida.stdout.strip())
    contenido = open(os.path.join(carpeta, "data", "exportaciones", json_completo[0]), encoding="utf-8").read() if json_completo else ""
    informe("la exportación programada no incluye contraseñas ni intentos de login", "password_hash" not in contenido and "intentos_login" not in contenido)
    http_cli = Cliente().pedir("servicios/exportar_programado.php")[0]
    informe("el script de exportación no se puede ejecutar desde la web", http_cli == 403, http_cli)

    # ---------------- 11. Reinstalación ----------------
    c.close()
    t0 = time.perf_counter()
    r = subprocess.run(php + [os.path.join(carpeta, "servicios", "instalar.php"), "--forzar"], capture_output=True, text=True)
    informe("instalar --forzar recrea la base de datos", r.returncode == 0 and "reservas" in r.stdout, "%.2f s: %s" % (time.perf_counter() - t0, r.stdout.splitlines()[1] if r.stdout else r.stderr[:80]))
    r = subprocess.run(php + [os.path.join(carpeta, "servicios", "instalar.php")], capture_output=True, text=True)
    informe("instalar sin --forzar no borra la base existente", "ya existe" in r.stdout)


main()
