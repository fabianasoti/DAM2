import json

NOMBRE_FICHERO = "biblioteca.dat"

def crear_lista_libros():
    libros = [
        {"titulo": "Hermosas criaturas", "autor": "Kami Garcia y Margaret Stohl", "anio": 2009, "paginas": 563},
        {"titulo": "Todas las hadas del reino", "autor": "Laura Gallego", "anio": 2015, "paginas": 480},
        {"titulo": "Las aventuras de Sherlock Holmes", "autor": "Arthur Conan Doyle", "anio": 1892, "paginas": 307},
    ]
    print(type(libros))
    return libros

def serializar_libros(libros):
    cadena = json.dumps(libros)
    print(cadena)
    print(type(cadena))
    return cadena

def guardar_en_fichero(cadena):
    archivo = open("biblioteca.dat", 'w')
    archivo.write(cadena)
    archivo.close()


def guardar_en_fichero(cadena):
    archivo = open("biblioteca.dat", 'w')
    archivo.write(cadena)
    archivo.close()


def main():
    libros = crear_lista_libros()
    cadena = serializar_libros(libros)
    guardar_en_fichero(cadena)

if __name__ == "__main__":
    main()



