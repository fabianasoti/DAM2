"""
Pequeña app que demuestra la gestión de flujos de datos con ficheros.
Conceptos que vemos en acción: abrir/cerrar, flujo de salida (escribir),
flujo de entrada (leer), el puntero de lectura/escritura (seek),
manejo de excepciones y ficheros binarios.
"""

NOMBRE_FICHERO_TEXTO = "datos.txt"
NOMBRE_FICHERO_BINARIO = "datos.bin"


def escribir_temperaturas():
    """Flujo de SALIDA: el programa escribe datos hacia el fichero."""
    print("\n--- 1. Flujo de salida: escribiendo en el fichero ---")
    flujo = open("temperaturas.txt", "w")
    flujo.write("18.5\n")
    flujo.write("21.0\n")
    flujo.write("19.2\n")
    flujo.close()
    print(f"Se ha escrito 'temperaturas.txt' correctamente.")


def leer_temperaturas():
    """Flujo de ENTRADA: el programa lee datos desde el fichero."""
    print("\n--- 2. Flujo de entrada: leyendo todo el fichero ---")
    flujo = open("temperaturas.txt", "r")
    contenido = flujo.read()
    flujo.close()
    print(contenido)


def saltar_primera_temperatura():
    """El puntero controla en qué posición del fichero estamos."""
    print("--- 3. Moviendo el puntero con seek() ---")
    flujo = open("temperaturas.txt", "r")
    flujo.readline()             # leemos la primera línea, el puntero avanza
    posicion = flujo.tell()      # guardamos dónde ha quedado el puntero
    flujo.seek(0)                # volvemos al principio del fichero
    flujo.seek(posicion)         # y saltamos otra vez a esa posición guardada
    resto = flujo.read()         # leemos desde ahí hasta el final
    flujo.close()
    print("Nos saltamos la primera línea y leemos el resto:")
    print(resto)


def comprobar_fichero_configuracion():
    """Manejo de excepciones: qué pasa si el fichero no existe."""
    print("--- 4. Manejo de excepciones ---")
    try:
        flujo = open("configuracion.txt", "r")
        flujo.close()
    except FileNotFoundError:
        print("Error controlado: el fichero no existe, pero el programa no se cae.")


def guardar_numero_registros():
    """Ficheros binarios: útiles para datos que no son texto plano."""
    print("\n--- 5. Trabajando con un fichero binario ---")
    datos = bytes([3])  # equivale a las letras A, B, C, D

    flujo_salida = open("contador.bin", "wb")  # wb = write binary
    flujo_salida.write(datos)
    flujo_salida.close()

    flujo_entrada = open("contador.bin", "rb")  # rb = read binary
    leido = flujo_entrada.read()
    flujo_entrada.close()

    print(f"Bytes escritos:  {list(datos)}")
    print(f"Bytes leídos:    {list(leido)}")
    print(f"Como texto:      {leido.decode('utf-8')}")


def main():
    escribir_temperaturas()
    leer_temperaturas()
    saltar_primera_temperatura()
    comprobar_fichero_configuracion()
    guardar_numero_registros()


if __name__ == "__main__":
    main()