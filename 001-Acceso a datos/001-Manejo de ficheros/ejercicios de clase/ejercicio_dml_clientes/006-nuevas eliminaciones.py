import mysql.connector

conexion = mysql.connector.connect(
    host="localhost",
    user="accesoadatos2526",
    password="Accesoadatos2526$",
    database="accesoadatos2526"
)
cursor = conexion.cursor()

# Eliminar cliente por email (o puedes usar Identificador = 6)
sql = 'DELETE FROM clientes WHERE email = "elena@torres.com"'

cursor.execute(sql)
conexion.commit()
print("Cliente eliminado correctamente.")

cursor.close()
conexion.close()
