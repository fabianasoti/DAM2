
class Agenda:

    def __init__(self, archivo):
        self.archivo = archivo

    def guardar(self, nombre, telefono):
        with open(self.archivo, "a", encoding="utf-8") as f:
            f.write(nombre + "," + telefono + "\n")

    def leer(self):
        with open(self.archivo, "r", encoding="utf-8") as f:
            for linea in f:
                nombre, telefono = linea.strip().split(",")
                print(nombre + ":" + telefono)


print("--- MI AGENDA ---")
agenda = Agenda("agenda.csv")
agenda.guardar("Susana", "611222333")
agenda.guardar("Cornelia", "622333444")
agenda.guardar("Dionisio", "633444555")
agenda.leer()
