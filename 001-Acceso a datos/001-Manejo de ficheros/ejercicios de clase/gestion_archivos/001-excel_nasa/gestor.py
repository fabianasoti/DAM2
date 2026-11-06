"""
Gestor de planetas
------------------
Lee tabla1.csv, los convierte en una lista de diccionarios,
los guarda en planetas.json, escribe un log.txt con una línea
por planeta procesado, y al final cuenta cuántas líneas tiene
ese log.txt.
"""

import csv
import json


def leer_csv(ruta_csv):
    """Paso 1 y 2: lee el CSV y devuelve una lista de diccionarios."""
    planetas = []

    with open(ruta_csv, mode="r", encoding="utf-8-sig", newline="") as archivo_csv:
        lector = csv.DictReader(archivo_csv, delimiter=";")

        for fila in lector:
            planeta = {
                "Planeta": fila["Column1"],
                "Mass (1024kg)": fila["Mass (1024kg)"],
                "Diameter (km)": fila["Diameter (km)"],
                "Density (kg/m3)": fila["Density (kg/m3)"],
                "Gravity (m/s2)": fila["Gravity (m/s2)"],
                "Escape Velocity (km/s)": fila["Escape Velocity (km/s)"],
                "Rotation Period (hours)": fila["Rotation Period (hours)"],
                "Length of Day (hours)": fila["Length of Day (hours)"],
                "Distance from Sun (106 km)": fila["Distance from Sun (106 km)"],
                "Perihelion (106 km)": fila["Perihelion (106 km)"],
                "Aphelion (106 km)": fila["Aphelion (106 km)"],
                "Orbital Period (days)": fila["Orbital Period (days)"],
                "Orbital Velocity (km/s)": fila["Orbital Velocity (km/s)"],
                "Orbital Inclination (degrees)": fila["Orbital Inclination (degrees)"],
                "Orbital Eccentricity": fila["Orbital Eccentricity"],
                "Obliquity to Orbit (degrees)": fila["Obliquity to Orbit (degrees)"],
                "Mean Temperature (C)": fila["Mean Temperature (C)"],
                "Surface Pressure (bars)": fila["Surface Pressure (bars)"],
                "Number of Moons": fila["Number of Moons"],
                "Ring System?": fila["Ring System?"],
                "Global Magnetic Field?": fila["Global Magnetic Field?"]
            }

            planetas.append(planeta)

    return planetas


def guardar_json(planetas, ruta_json):
    """Paso 3: guarda la lista de diccionarios en un archivo JSON legible."""
    with open(ruta_json, mode="w", encoding="utf-8") as archivo_json:
        json.dump(planetas, archivo_json, indent=4, ensure_ascii=False)


def escribir_log(planetas, ruta_log):
    """Paso 4: escribe una línea de log por cada planeta procesado."""
    with open(ruta_log, mode="w", encoding="utf-8") as archivo_log:
        for planeta in planetas:
            linea = f"Planeta añadido: {planeta['Planeta']}\n"
            archivo_log.write(linea)


def contar_lineas_log(ruta_log):
    """Paso 5: abre el log.txt y cuenta cuántas líneas (planetas) tiene."""
    with open(ruta_log, mode="r", encoding="utf-8") as archivo_log:
        lineas = archivo_log.readlines()

    return len(lineas)


def main():
    ruta_csv = "tabla1.csv"
    ruta_json = "planetas.json"
    ruta_log = "log.txt"

    # 1 y 2. Leer el CSV y convertir cada fila en un diccionario
    planetas = leer_csv(ruta_csv)
    print(f"Se han leído {len(planetas)} planetas desde '{ruta_csv}'.")

    # 3. Guardar todos los planetas en planetas.json
    guardar_json(planetas, ruta_json)
    print(f"Planetas guardados en '{ruta_json}'.")

    # 4. Escribir log.txt con una línea por planeta
    escribir_log(planetas, ruta_log)
    print(f"Registro de actividad escrito en '{ruta_log}'.")

    # 5. Leer log.txt y mostrar cuántas líneas (planetas) se han procesado
    total = contar_lineas_log(ruta_log)
    print(f"\nTotal de planetas procesados según el log: {total}")


if __name__ == "__main__":
    main()