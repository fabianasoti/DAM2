

class Agenda:

    def __init__(self,archivo):
        self.archivo = archivo

    def guardar(self,nombre,telefono):
        f = open(self.archivo, "a")
        f.write(nombre +","+ telefono + "\n")
        f.close

    def leer(self):
        f = open(self.archivo, "r")
        for linea in f:
            nombre, telefono = linea.strip().split(",")
            print(nombre +":"+ telefono)
        f.close()



print("--- MI AGENDA ---")
agenda = Agenda("agenda.csv")
agenda.guardar("Marta","611222333")
agenda.guardar("Pablo","622333444")
agenda.guardar("Lucia","633444555")
agenda.leer()



