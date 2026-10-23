import mysql.connector

conexion = mysql.connector.connect(
    host="localhost",
    user="accesoadatos2526",
    password="Accesoadatos2526$",
    database="accesoadatos2526"
)
cursor = conexion.cursor()

# Insertar el primer cliente
sql_carlos = """
INSERT INTO clientes VALUES (
    NULL,
    "Carlos",
    "Gomez",
    "carlos@gomez.com"
)
"""
cursor.execute(sql_carlos)

# Insertar el segundo cliente
sql_elena = """
INSERT INTO clientes VALUES (
    NULL,
    "Elena",
    "Torres",
    "elena@torres.com"
)
"""
cursor.execute(sql_elena)

conexion.commit()
print("Clientes insertados correctamente.")

cursor.close()
conexion.close()
