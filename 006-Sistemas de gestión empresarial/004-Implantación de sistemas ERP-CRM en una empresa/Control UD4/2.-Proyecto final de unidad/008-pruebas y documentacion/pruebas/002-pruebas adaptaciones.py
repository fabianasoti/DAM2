# Pruebas de las adaptaciones de la UD4: vistas, facturación, informes, triggers,
# paneles e integración con darkorange.
#
# Uso:  python3 "pruebas/002-pruebas adaptaciones.py"
# Para la integración arranca su propia copia temporal de darkorange (puerto 8001),
# que busca en la carpeta 1.-Ejercicios de la entrega. El puerto 8001 debe estar libre.
import datetime, glob, http.cookiejar, json, os, shutil, signal, socket, sqlite3, subprocess, sys, tempfile, time
import urllib.error, urllib.parse, urllib.request

PROYECTO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTREGA = os.path.dirname(os.path.dirname(PROYECTO))

class App:
    def __init__(s,puerto=8095):
        s.dir=os.path.join(tempfile.mkdtemp(),"app"); shutil.copytree(PROYECTO,s.dir,ignore=shutil.ignore_patterns("*.db","exportaciones","pruebas"))
        s.url=f"http://127.0.0.1:{puerto}/"
        c=socket.socket(); assert c.connect_ex(("127.0.0.1",puerto))!=0,"puerto ocupado"; c.close()
        s.log=open(os.path.join(s.dir,"..","php.log"),"w")
        s.p=subprocess.Popen(["php","-S",f"127.0.0.1:{puerto}","-t",s.dir],stdout=s.log,stderr=s.log,start_new_session=True); time.sleep(0.8)
    def cliente(s,email="lucia.ferrer@cardomarino.example"):
        op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        def pedir(ruta,datos=None):
            req=urllib.request.Request(s.url+ruta.replace(" ","%20"),data=None if datos is None else json.dumps(datos).encode(),headers={} if datos is None else {"Content-Type":"application/json"})
            try:
                with op.open(req,timeout=60) as r: cod,t=r.status,r.read().decode()
            except urllib.error.HTTPError as e: cod,t=e.code,e.read().decode()
            try: return cod,json.loads(t)
            except ValueError: return cod,t
        if email:
            cod,r=pedir("api/002-sesion.php?accion=login",{"email":email,"password":"Thistle2026!"}); assert cod==200,(cod,r)
        return pedir
    def db(s):
        c=sqlite3.connect(os.path.join(s.dir,"data","003-thistle.db")); c.execute("PRAGMA foreign_keys=ON"); return c
    def cerrar(s):
        os.killpg(s.p.pid,signal.SIGTERM); s.p.wait()
OK=[0,0]
def comprobar(c,t):
    OK[1]+=1; OK[0]+=bool(c); print(("  OK    " if c else "  FALLO ")+t)


def prueba_002():
    print("\n== Tablas, vistas y consultas ==")
    a=App()
    try:
        p=a.cliente()
        cod,r=p("api/005-reservas.php?accion=lista&estado=confirmada"); comprobar(cod==200 and r["reservas"] and "cliente" in r["reservas"][0] and "habitacion_id" in r["reservas"][0],"lista de reservas desde la vista")
        n=r["reservas"][0]["cliente"].split()[0]; cod,r2=p("api/005-reservas.php?accion=lista&q="+urllib.parse.quote(n)); comprobar(cod==200 and all(n in x["cliente"] for x in r2["reservas"]),"búsqueda por nombre en la vista")
        cod,c=p("api/009-consultas.php"); comprobar(cod==200 and len(c["clientes"])==50 and len(c["paises"])>=5,"consultas sobre vistas")
        d=a.db()
        total=d.execute("select round(sum(importe_total),2) from reservas where estado<>'cancelada'").fetchone()[0]
        comprobar(abs(sum(x["ingresos"] for x in c["paises"])-total)<1,"la suma por países cuadra con las reservas")
        cod,e=p("api/004-crud.php?entidad=clientes"); comprobar(cod==200 and any(f[0]=="idioma" for f in e["entidad"]["campos"]),"el formulario de clientes tiene idioma y observaciones")
        cod,g=p("api/004-crud.php?accion=guardar",{"entidad":"clientes","datos":{"nombre":"Ana","apellidos":"Prueba","dni_pasaporte":"ZZ9999999","pais":"Francia","idioma":"Francés","observaciones":"Necesita cuna"}}); comprobar(cod in (200,201) and g.get("ok"),"alta con campos nuevos "+str(g))
        cod,g=p("api/004-crud.php?accion=guardar",{"entidad":"clientes","datos":{"nombre":"Ana","apellidos":"Mal","dni_pasaporte":"ZZ9999998","pais":"Francia","idioma":"Klingon"}}); comprobar(cod==400 or not g.get("ok"),"idioma no válido rechazado")
        m=a.cliente("pablo.navarro@cardomarino.example"); cod,_=m("api/009-consultas.php"); comprobar(cod==403,"mantenimiento no puede ver las consultas")
        comprobar(d.execute("select count(*) from clientes where idioma='Alemán' and pais='Alemania'").fetchone()[0]>0,"idiomas coherentes con el país")
    finally: a.cerrar()


def prueba_003():
    print("\n== Facturación ==")
    a=App()
    try:
        p=a.cliente()
        d_hoy=__import__("datetime").date.today().strftime("%Y-%m")
        cod,r=p("api/010-facturas.php?accion=lista"); comprobar(cod==200 and r["mes"]==d_hoy and r["totales"]["facturas"]==len(r["facturas"])>0,f"facturas del mes actual: {r['totales']}")
        d=a.db()
        comprobar(d.execute("select count(*) from facturas").fetchone()[0]==d.execute("select count(*) from reservas where estado='check-out' and importe_total>0").fetchone()[0],"una factura por cada estancia terminada")
        comprobar(d.execute("select count(*) from facturas where abs(base+iva-total)>0.005 or abs(base-round(total/1.10,2))>0.005").fetchone()[0]==0,"base + IVA = total en todas")
        comprobar(d.execute("select count(*)-count(distinct numero) from facturas").fetchone()[0]==0,"números de factura sin repetir")
        malos=0
        for (anio,) in d.execute("select distinct substr(numero,2,4) from facturas").fetchall():
            nums=sorted(int(x[0][7:]) for x in d.execute("select numero from facturas where substr(numero,2,4)=?",(anio,)))
            malos+= nums!=list(range(1,len(nums)+1))
        comprobar(malos==0,"numeración correlativa sin huecos por año")
        f=r["facturas"][0]; cod,v=p(f"api/010-facturas.php?accion=ver&id={f['id']}"); comprobar(cod==200 and v["factura"]["numero"]==f["numero"],"detalle de factura "+v["factura"]["numero"])
        cod,_=p("api/010-facturas.php?accion=lista&mes=2026-13"); comprobar(cod==400,"mes inválido rechazado")
        cod,_=p("api/010-facturas.php?accion=ver&id=999999"); comprobar(cod==404,"factura inexistente 404")
        cod,t=p("servicios/003-salida.php?tabla=facturas&formato=json"); comprobar(cod==200,"exportación de facturas")
        l=a.cliente("rosa.delgado@cardomarino.example"); cod,_=l("api/010-facturas.php?accion=lista"); comprobar(cod==403,"limpieza no ve facturas")
        an=a.cliente(None); cod,_=an("api/010-facturas.php?accion=lista"); comprobar(cod==401,"sin sesión no se ven")
    finally: a.cerrar()


def prueba_004():
    print("\n== Informes imprimibles ==")
    a=App()
    try:
        p=a.cliente(); d=a.db()
        cod,r=p("api/011-informes.php?accion=parte"); comprobar(cod==200 and r["alojados"],f"parte diario: {len(r['llegadas'])} llegadas, {len(r['salidas'])} salidas, {len(r['alojados'])} alojados")
        n=d.execute("select count(*) from reservas where estado<>'cancelada' and fecha_entrada<=date('now','localtime') and date('now','localtime')<fecha_salida").fetchone()[0]
        comprobar(len(r["alojados"])==n,"los alojados cuadran con la base de datos")
        cod,m=p("api/011-informes.php?accion=mensual"); t=m["totales"]
        comprobar(cod==200 and abs(sum(x["total"] for x in m["por_tipo"])-t["total"])<0.05 and abs(sum(x["total"] for x in m["por_pago"])-t["total"])<0.05,f"resumen mensual cuadra por tipo y por pago: {t['total']} €")
        fid=d.execute("select max(id) from facturas").fetchone()[0]
        cod,f=p(f"api/011-informes.php?accion=factura&id={fid}"); comprobar(cod==200 and "No es una factura real" in f["emisor"]["aviso"],"factura imprimible con aviso de datos ficticios")
        cod,_=p("api/011-informes.php?accion=parte&fecha=ayer"); comprobar(cod==400,"fecha inválida rechazada")
        cod,_=p("api/011-informes.php?accion=otro"); comprobar(cod==404,"acción inválida rechazada")
        l=a.cliente("rosa.delgado@cardomarino.example"); cod,_=l("api/011-informes.php?accion=parte"); comprobar(cod==403,"limpieza no ve los informes")
    finally: a.cerrar()


def prueba_005():
    print("\n== Procedimientos del servidor (triggers) ==")
    a=App()
    try:
        p=a.cliente(); hoy=datetime.date.today()
        p("api/005-reservas.php?accion=lista")   # crea la base
        d=a.db()
        res=d.execute("select id,habitacion_id,cliente_id,importe_total,canal from reservas where estado='check-in' limit 1").fetchone()
        antes=d.execute("select count(*) from facturas").fetchone()[0]
        ult=max(int(x[0][7:]) for x in d.execute("select numero from facturas where numero like ?",(f"F{hoy.year}-%",)))
        d.close()
        cod,r=p("api/005-reservas.php?accion=estado",{"id":res[0],"estado":"check-out"}); comprobar(cod==200 and r.get("factura")==f"F{hoy.year}-{ult+1:05d}",f"el check-out crea la factura con el número siguiente: {r.get('factura')}")
        d=a.db()
        f=d.execute("select total,base,iva,cliente_id,fecha from facturas where reserva_id=?",(res[0],)).fetchone()
        imp=d.execute("select importe_total from reservas where id=?",(res[0],)).fetchone()[0]
        comprobar(f and abs(f[0]-imp)<0.005 and abs(f[1]+f[2]-f[0])<0.005 and f[3]==res[2] and f[4]==hoy.isoformat(),"importe, IVA, cliente y fecha correctos")
        comprobar(d.execute("select count(*) from facturas").fetchone()[0]==antes+1,"solo se crea una factura")
        for sql,t in [("update facturas set total=1 where reserva_id=%d"%res[0],"no se puede modificar"),("delete from facturas where reserva_id=%d"%res[0],"no se puede borrar")]:
            try: d.execute(sql); comprobar(False,"factura "+t)
            except sqlite3.IntegrityError as e: comprobar("factura" in str(e).lower(),"factura: "+str(e))
        d.rollback(); d.close()
        cod,r=p("api/005-reservas.php?accion=estado",{"id":res[0],"estado":"check-out"}); comprobar(cod==409,"repetir el check-out se rechaza")
        d=a.db(); h=d.execute("select id,numero,planta,tipo,capacidad,precio_noche from habitaciones where id=?",(res[1],)).fetchone(); d.close()
        cod,g=p("api/004-crud.php?accion=guardar",{"entidad":"habitaciones","id":h[0],"datos":{"numero":h[1],"planta":h[2],"tipo":h[3],"capacidad":h[4],"precio_noche":h[5]+10}})
        d=a.db(); comprobar(d.execute("select count(*) from auditoria where accion='cambio de precio' and detalle like ?",(f"%{h[1]}:%",)).fetchone()[0]==1,"el cambio de precio queda auditado "+str(g))
    finally: a.cerrar()


def prueba_007():
    print("\n== Paneles e integración con darkorange ==")
    origen=glob.glob(os.path.join(glob.escape(ENTREGA),"1.-Ejercicios","002-*","jocarsa-universo-darkorange-CODIGO-COMPLETO"))[0]
    tmp=os.path.join(tempfile.mkdtemp(),"dk"); shutil.copytree(origen,tmp)
    c=socket.socket(); assert c.connect_ex(("127.0.0.1",8001))!=0,"8001 ocupado"; c.close()
    def dk_db(): return sqlite3.connect(tmp+"/universo/data/jocarsa.sqlite")
    a=App(); dk=None
    try:
        p=a.cliente()
        cod,k=p("api/008-kpis.php"); comprobar(cod==200 and len(k["facturacion"])==12 and k["formas_pago"] and len(k["paises"])==6,"paneles: facturación 12 meses, formas de pago y países")
        d=a.db(); real=d.execute("select round(sum(total),2) from facturas where strftime('%Y-%m',fecha)=strftime('%Y-%m','now','localtime')").fetchone()[0]; d.close()
        comprobar(abs(k["facturacion"][-1]["total"]-real)<0.01,f"el facturado del mes cuadra: {real} €")
        cod,e=p("api/012-integracion.php"); comprobar(cod==200 and e["conectado"] is False and e["pendientes"]>3000,f"sin darkorange: 'sin respuesta', {e['pendientes']} pendientes")
        cod,r=p("api/012-integracion.php?accion=enviar",{}); comprobar(cod==502 and "No se puede conectar" in r["error"],"enviar con darkorange apagado: aviso claro")
        dk=subprocess.Popen(["php","-S","127.0.0.1:8001","-t",tmp],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True); time.sleep(0.8)
        x=dk_db(); c0=x.execute("select count(*) from clientes").fetchone()[0]; f0=x.execute("select count(*) from factura").fetchone()[0]; x.close()
        cod,e=p("api/012-integracion.php"); comprobar(e["conectado"] is True,"con darkorange arrancado: disponible")
        cod,r=p("api/012-integracion.php?accion=enviar",{}); comprobar(cod==200 and r["enviadas_ahora"]==25 and r["enviadas"]==25,f"envía 25 facturas {r if cod!=200 else ''}")
        x=dk_db(); nf=x.execute("select count(*) from factura").fetchone()[0]-f0; nc=x.execute("select count(*) from clientes").fetchone()[0]-c0
        d=a.db(); distintos=d.execute("select count(distinct cliente_id) from facturas where enviada is not null").fetchone()[0]
        comprobar(nf==25 and nc==distintos,f"en darkorange: {nf} facturas nuevas y {nc} clientes nuevos (sin duplicar clientes)")
        n,v,cli=x.execute("select numerodefactura,valor,cliente from factura order by id desc limit 1").fetchone()
        t,nom=d.execute("select f.total,c.nombre from facturas f join clientes c on c.id=f.cliente_id where numero=?",(n,)).fetchone()
        comprobar(abs(float(v)-t)<0.01 and x.execute("select nombre from clientes where id=?",(int(float(cli)),)).fetchone()[0]==nom,f"factura {n}: mismo importe y mismo cliente en los dos sistemas")
        np_=x.execute("select count(*) from pedido").fetchone()[0]; prods=x.execute("select nombre from productos where nombre like 'Alojamiento %'").fetchall()
        comprobar(np_==25 and 1<=len(prods)<=3 and len(prods)==len(set(prods)) and x.execute("select count(*) from factura f join pedido p on p.id=f.pedido where p.cliente=f.cliente and p.producto=f.producto").fetchone()[0]==25,f"25 pedidos enlazados y {len(prods)} productos (tipos de habitación) sin duplicar")
        x.close(); d.close()
        cod,r=p("api/012-integracion.php?accion=enviar",{}); x=dk_db(); comprobar(r["enviadas"]==50 and x.execute("select count(*)-count(distinct numerodefactura) from factura").fetchone()[0]==0,"segundo envío: 50 en total, ninguna repetida"); x.close()
        rec=a.cliente("sergio.molina@cardomarino.example"); cod,_=rec("api/012-integracion.php"); comprobar(cod==403,"solo el administrador puede integrar")
        cod,_=p("api/012-integracion.php?accion=enviar"); comprobar(cod==405,"enviar exige POST")
    finally:
        a.cerrar()
        if dk: os.killpg(dk.pid,signal.SIGTERM); dk.wait()


prueba_002()
prueba_003()
prueba_004()
prueba_005()
prueba_007()
print(f"\nRESULTADO: {OK[0]} de {OK[1]} comprobaciones correctas")
sys.exit(0 if OK[0] == OK[1] else 1)
