import mysql.connector

# Conexión a la base de datos
conexion = mysql.connector.connect(
    host="localhost",
    user="accesoadatos2526",
    password="Accesoadatos2526$",
    database="accesoadatos2526"
)

cursor = conexion.cursor()

# Sentencia SQL para eliminar la clienta
sql = 'DELETE FROM clientes WHERE Identificador = 4'

cursor.execute(sql)
conexion.commit()

cursor.close()
conexion.close()
