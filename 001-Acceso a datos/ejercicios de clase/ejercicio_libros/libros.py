import os

import mysql.connector


libros = [
    {
        "titulo": "Don Quijote",
        "paginas": 863,
        "generos": ["novela", "aventuras", "humor"],
    },
    {
        "titulo": "Platero y yo",
        "paginas": 144,
        "generos": ["poesía", "infantil"],
    },
    {"titulo": "Marianela", "paginas": 256, "generos": ["novela"]},
]

for clave, valor in libros[0].items():
    print(clave, type(valor))


conn = mysql.connector.connect(
    host="localhost",
    user="desfase",
    password=os.getenv("MYSQL_PASSWORD", ""),
    database="desfase",
)
cursor = conn.cursor()

cursor.execute("DROP TABLE IF EXISTS libro_generos")
cursor.execute("DROP TABLE IF EXISTS libros")

cursor.execute(
    """
    CREATE TABLE libros (
        identificador INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        paginas INT NOT NULL
    )
    """
)

cursor.execute(
    """
    CREATE TABLE libro_generos (
        identificador INT AUTO_INCREMENT PRIMARY KEY,
        libro_id INT NOT NULL,
        valor VARCHAR(255) NOT NULL,
        FOREIGN KEY (libro_id) REFERENCES libros(identificador)
    )
    """
)

for libro in libros:
    cursor.execute(
        "INSERT INTO libros (titulo, paginas) VALUES (%s, %s)",
        (libro["titulo"], libro["paginas"]),
    )
    id_libro = cursor.lastrowid

    for genero in libro["generos"]:
        cursor.execute(
            "INSERT INTO libro_generos (libro_id, valor) VALUES (%s, %s)",
            (id_libro, genero),
        )

conn.commit()

cursor.execute("SELECT identificador, titulo, paginas FROM libros")
filas = cursor.fetchall()

recuperadas = []
for id_libro, titulo, paginas in filas:
    cursor.execute(
        "SELECT valor FROM libro_generos WHERE libro_id = %s",
        (id_libro,),
    )
    generos = [fila[0] for fila in cursor.fetchall()]
    recuperadas.append(
        {"titulo": titulo, "paginas": paginas, "generos": generos}
    )

print(recuperadas)
cursor.close()
conn.close()