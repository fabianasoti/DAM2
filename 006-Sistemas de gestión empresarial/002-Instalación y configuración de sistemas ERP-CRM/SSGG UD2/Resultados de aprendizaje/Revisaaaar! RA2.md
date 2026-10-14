# RA1:
a) Identificación de los módulos que componen el ERP-CRM:

Justificación: Explicar que tu sistema es un híbrido adaptado a un entorno hotelero (PMS + GMAO), detallando los módulos principales: Módulo de Recepción/Reservas (gestión de habitaciones y clientes) y Módulo de Mantenimiento/GMAO (control de averías, partes de trabajo e incidencias de las instalaciones).

b) Realización de diferentes tipos de instalaciones:

Justificación: Explicar cómo se realiza la instalación inicial del prototipo mediante SQLite y la transición o compatibilidad prevista con MySQL, utilizando scripts automatizados (instalar.php) y asistentes web (instalador.html).

c) Configuración de los módulos instalados:

Justificación: Describir el uso del archivo centralizado de configuración (data/config.php) para definir parámetros globales, rutas y credenciales de acceso a la base de datos.

d) Instalaciones adaptadas a las necesidades planteadas:

Justificación: Justificar por qué has optado por una arquitectura cliente-servidor estricta (separando el cliente HTML/JS del servidor PHP mediante peticiones fetch), adaptada a los requerimientos de un PMS con control de mantenimiento en tiempo real.

e) Verificación del funcionamiento:

Justificación: Detallar cómo se han probado las operaciones CRUD (Crear, Leer, Actualizar, Borrar) tanto en la API como en la interfaz web, comprobando la correcta inserción y recuperación de datos desde la base de datos.

f) Documentación de operaciones e incidencias:

Justificación: Recoger los pasos ejecutados durante el despliegue del entorno y los posibles errores encontrados (por ejemplo, permisos de escritura en la carpeta data/ o fallos en las cabeceras CORS de la API) junto con sus soluciones.


# SQL BD:
Para este tipo de sistema, necesitamos cubrir las entidades principales de un hotel y de su mantenimiento:

Habitaciones (habitaciones): Número, tipo, estado (disponible, ocupada, sucia, en mantenimiento) y precio.

Huéspedes / Clientes (clientes): Datos personales, contacto y documentos de identidad.

Reservas (reservas): Relación entre cliente y habitación, fechas de entrada/salida y estado de la reserva.

Incidencias / Mantenimiento - GMAO (mantenimiento): Partes de averías o revisiones asociadas a una habitación o zona, prioridad, estado y empleado asignado.

Empleados / Usuarios (usuarios): Personal del hotel (recepción, limpieza, mantenimiento) con sus roles y credenciales.

# Config.php
Siguiendo el modelo que vimos en clase (separando la configuración y centralizando los parámetros en la carpeta data/), este archivo se encargará de definir las rutas de la base de datos SQLite, los parámetros globales de la aplicación y la gestión de cabeceras para permitir la comunicación asíncrona (AJAX / Fetch) con la API.


