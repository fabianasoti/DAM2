import json

NOMBRE_FICHERO = "biblioteca.dat"


def leer_fichero():
    archivo = open(NOMBRE_FICHERO, 'r')
    linea = archivo.readlines()[0]
    print(linea)
    print(type(linea))
    archivo.close()
    return linea


def deserializar_libros(linea):
    devuelta = json.loads(linea)
    print(devuelta)
    print(type(devuelta))


def main():
    linea = leer_fichero()
    deserializar_libros(linea)


if __name__ == "__main__":
    main()