NOMBRE_FICHERO = "peliculas_secuencial.txt"

def escribirvarias_peliculas():
    peliculas = [
        "El Padrino,148\n",
        "El Caballero Oscuro,198\n",
        "Pulp Fiction,154\n",
        "Forrest Gump,142\n"
    ]
    fichero = open(NOMBRE_FICHERO, "w")
    fichero.writelines(peliculas)
    fichero.close()