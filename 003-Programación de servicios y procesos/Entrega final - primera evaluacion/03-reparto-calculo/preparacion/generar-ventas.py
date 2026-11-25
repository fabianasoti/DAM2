# Genera datos/ventas.csv: ventas inventadas de una cadena ficticia de papelerías
# Semilla fija: siempre salen las mismas filas
import random
random.seed(2026)

tiendas = ["Centro", "Puerto", "Norte", "Mercado", "Universidad"]
# producto: precio en céntimos (así sumamos números enteros y no hay errores de decimales)
productos = {
    "Cuaderno A5": 395, "Mochila escolar": 2490, "Estuche": 750, "Rotuladores x12": 650,
    "Carpeta archivadora": 560, "Calculadora": 1290, "Agenda 2027": 1190, "Pegamento": 180,
}
nombres = list(productos)

filas = ["fecha,tienda,producto,unidades,precio_centimos"]
for i in range(2400):
    dia = 1 + (i * 30) // 2400          # reparte las ventas entre el 1 y el 30 de septiembre
    producto = random.choice(nombres)
    filas.append("2026-09-%02d,%s,%s,%d,%d" % (
        dia, random.choice(tiendas), producto, random.randint(1, 6), productos[producto]))

open("../proyecto/datos/ventas.csv", "w").write("\n".join(filas) + "\n")
print(len(filas) - 1, "ventas generadas")
