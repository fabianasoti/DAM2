# PROGRAMA EN PYTHON
# Parte 1: guardar y leer clientes en un archivo CSV
# Parte 2: mostrar lo que hay dentro de una carpeta

import os


# PARTE 1: una clase para guardar y leer clientes
class Clientes:

    def __init__(self, archivo):
        self.archivo = archivo

    def guardar(self, nombre, correo):
        f = open(self.archivo, "a")
        f.write(nombre + "," + correo + "\n")
        f.close()

    def leer(self):
        f = open(self.archivo, "r")
        for linea in f:
            datos = linea.strip().split(",")
            print("Nombre:", datos[0], "- Correo:", datos[1])
        f.close()


# PARTE 2: una funcion que se llama a si misma
def mostrar(carpeta, espacios):
    for nombre in sorted(os.listdir(carpeta)):
        print(espacios + nombre)
        ruta = os.path.join(carpeta, nombre)
        if os.path.isdir(ruta):
            mostrar(ruta, espacios + "    ")


# PROGRAMA PRINCIPAL
print("--- PARTE 1 ---")
clientes = Clientes("clientes.csv")
clientes.guardar("Ana", "ana@correo.com")
clientes.guardar("Luis", "luis@correo.com")
clientes.leer()

print("--- PARTE 2 ---")
os.makedirs("mi_carpeta/fotos/verano", exist_ok=True)
open("mi_carpeta/notas.txt", "w").close()
open("mi_carpeta/fotos/verano/playa.jpg", "w").close()
mostrar("mi_carpeta", "")