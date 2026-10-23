import mysql.connector

# Conexión a la base de datos
conexion = mysql.connector.connect(
    host="localhost",
    user="accesoadatos2526",
    password="Accesoadatos2526$",
    database="accesoadatos2526"
)

cursor = conexion.cursor()

# Sentencia SQL de inserción
sql = """
INSERT INTO clientes VALUES (
    NULL,
    "Ana",
    "Martinez Ruiz",
    "ana@martinezruiz.com"
)
"""

cursor.execute(sql)
conexion.commit()

cursor.close()
conexion.close()
