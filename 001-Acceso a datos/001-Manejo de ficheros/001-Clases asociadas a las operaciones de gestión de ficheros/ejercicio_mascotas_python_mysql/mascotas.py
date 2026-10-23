import mysql.connector
 
# Paso 1. Los datos
mascotas = [
    {"nombre": "Toby", "edad": 3,
     "vacunas": ["rabia", "moquillo"]},
    {"nombre": "Luna", "edad": 5,
     "vacunas": ["rabia"]}
]
 
# Paso 3. Conexión
conn = mysql.connector.connect(host="localhost", user="desfase",
                               password="desfase", database="desfase")
cursor = conn.cursor()
 
# Paso 4. Borrar tablas antiguas
cursor.execute("DROP TABLE IF EXISTS mascotas_vacunas")
cursor.execute("DROP TABLE IF EXISTS mascotas")
 
# Paso 5. Tabla principal
cursor.execute("""
CREATE TABLE mascotas (
    Identificador INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    edad INT
)""")
 
# Paso 6. Tabla para la lista de vacunas
cursor.execute("""
CREATE TABLE mascotas_vacunas (
    Identificador INT AUTO_INCREMENT PRIMARY KEY,
    mascotas_id INT,
    valor VARCHAR(255),
    FOREIGN KEY (mascotas_id) REFERENCES mascotas(Identificador)
)""")
 
# Paso 7. Guardar
for mascota in mascotas:
    cursor.execute(
        "INSERT INTO mascotas (nombre, edad) VALUES (%s, %s)",
        (mascota["nombre"], mascota["edad"]))
    id_mascota = cursor.lastrowid
    for vacuna in mascota["vacunas"]:
        cursor.execute(
            "INSERT INTO mascotas_vacunas (mascotas_id, valor) "
            "VALUES (%s, %s)",
            (id_mascota, vacuna))
conn.commit()
 
# Paso 8. Recuperar
cursor.execute("SELECT Identificador, nombre, edad FROM mascotas")
filas = cursor.fetchall()
recuperadas = []
for (id_mascota, nombre, edad) in filas:
    cursor.execute(
        "SELECT valor FROM mascotas_vacunas WHERE mascotas_id = %s",
        (id_mascota,))
    vacunas = [fila[0] for fila in cursor.fetchall()]
    recuperadas.append({"nombre": nombre, "edad": edad, "vacunas": vacunas})
 
print(recuperadas)
conn.close()
