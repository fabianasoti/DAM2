"""
Pequeña app que demuestra la gestión de flujos de datos con ficheros.
Conceptos que vemos en acción: abrir/cerrar, flujo de salida (escribir),
flujo de entrada (leer), el puntero de lectura/escritura (seek),
manejo de excepciones y ficheros binarios.
"""

NOMBRE_FICHERO_TEXTO = "datos.txt"
NOMBRE_FICHERO_BINARIO = "datos.bin"


def escribir_flujo_salida():
    """Flujo de SALIDA: el programa escribe datos hacia el fichero."""
    print("\n--- 1. Flujo de salida: escribiendo en el fichero ---")
    flujo = open(NOMBRE_FICHERO_TEXTO, "w")
    flujo.write("Primera línea\n")
    flujo.write("Segunda línea\n")
    flujo.write("Tercera línea\n")
    flujo.close()
    print(f"Se ha escrito '{NOMBRE_FICHERO_TEXTO}' correctamente.")


def leer_flujo_entrada():
    """Flujo de ENTRADA: el programa lee datos desde el fichero."""
    print("\n--- 2. Flujo de entrada: leyendo todo el fichero ---")
    flujo = open(NOMBRE_FICHERO_TEXTO, "r")
    contenido = flujo.read()
    flujo.close()
    print(contenido)


def mover_puntero_con_seek():
    """El puntero controla en qué posición del fichero estamos."""
    print("--- 3. Moviendo el puntero con seek() ---")
    flujo = open(NOMBRE_FICHERO_TEXTO, "r")
    flujo.readline()             # leemos la primera línea, el puntero avanza
    posicion = flujo.tell()      # guardamos dónde ha quedado el puntero
    flujo.seek(0)                # volvemos al principio del fichero
    flujo.seek(posicion)         # y saltamos otra vez a esa posición guardada
    resto = flujo.read()         # leemos desde ahí hasta el final
    flujo.close()
    print("Nos saltamos la primera línea y leemos el resto:")
    print(resto)


def gestionar_excepcion():
    """Manejo de excepciones: qué pasa si el fichero no existe."""
    print("--- 4. Manejo de excepciones ---")
    try:
        flujo = open("fichero_que_no_existe.txt", "r")
        flujo.close()
    except FileNotFoundError:
        print("Error controlado: el fichero no existe, pero el programa no se cae.")


def trabajar_con_binario():
    """Ficheros binarios: útiles para datos que no son texto plano."""
    print("\n--- 5. Trabajando con un fichero binario ---")
    datos = bytes([65, 66, 67, 68])  # equivale a las letras A, B, C, D

    flujo_salida = open(NOMBRE_FICHERO_BINARIO, "wb")  # wb = write binary
    flujo_salida.write(datos)
    flujo_salida.close()

    flujo_entrada = open(NOMBRE_FICHERO_BINARIO, "rb")  # rb = read binary
    leido = flujo_entrada.read()
    flujo_entrada.close()

    print(f"Bytes escritos:  {list(datos)}")
    print(f"Bytes leídos:    {list(leido)}")
    print(f"Como texto:      {leido.decode('utf-8')}")


def main():
    escribir_flujo_salida()
    leer_flujo_entrada()
    mover_puntero_con_seek()
    gestionar_excepcion()
    trabajar_con_binario()


if __name__ == "__main__":
    main()