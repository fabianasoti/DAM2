import mysql.connector

conexion = mysql.connector.connect(
    host="localhost",
    user="accesoadatos2526",
    password="Accesoadatos2526$",
    database="accesoadatos2526"
)
cursor = conexion.cursor()

# Actualizar email y apellidos
sql = """
UPDATE clientes 
SET email = "carlos.gomez@nuevoemail.com", apellidos = "Gomez Perez" 
WHERE Identificador = 5
"""

cursor.execute(sql)
conexion.commit()
print("Datos de Carlos actualizados.")

cursor.close()
conexion.close()
