# Resultado de aprendizaje: Implanta sistemas ERP-CRM interpretando la documentación técnica e identificando las diferentes opciones y módulos.

## a) Se han identificado los módulos que componen el ERP-CRM.

**Aplicación en el proyecto:** Se ha analizado la arquitectura funcional de un sistema de gestión integral para el sector hotelero, dividiéndolo en dos grandes bloques operativos:

- **PMS (Property Management System):** Módulo encargado de la gestión de la operativa diaria del hotel, centrado en las entidades de habitaciones, clientes y reservas.
- **GMAO (Gestión de Mantenimiento Asistido por Ordenador):** Módulo enfocado en la conservación de las instalaciones y control de activos, gestionado mediante las entidades de mantenimiento e inventario.

## b) Se han realizado diferentes tipos de instalaciones.

**Aplicación en el proyecto:** Se ha llevado a cabo una instalación en entorno local bajo una arquitectura web ligera basada en PHP y SQLite (`thistle.db`), unificando las operaciones de base de datos a través de un script centralizado (`superapi.php`). Asimismo, se han configurado los permisos del sistema de archivos del servidor web (asignando permisos de lectura y escritura mediante `chmod` y control de directorios) para permitir la persistencia de datos y evitar restricciones de escritura en caliente.

## c) Se han configurado los módulos instalados.

**Aplicación en el proyecto:** Se ha configurado la interfaz de usuario mediante una hoja de estilos corporativa unificada (*Thistle & Clean Corporate*), estructurando un panel lateral de navegación para acceder de forma directa a las tablas del sistema. Además, se han adaptado los formularios dinámicos en JavaScript (`codigo.js`) para validar los campos de entrada, restringir errores tipográficos mediante selectores predefinidos (como el estado de las habitaciones: `Disponible`, `Ocupada`, `Limpieza`, `Mantenimiento`) y gestionar de forma controlada las restricciones de unicidad de la base de datos (`UNIQUE constraint`).

## d) Se han realizado instalaciones adaptadas na las necesidades planteadas en diferentes supuestos.

**Aplicación en el proyecto:** Se ha adaptado el despliegue a un entorno de gestión hotelera real de escala media, eliminando menús o complejidades innecesarias y enfocando el diseño hacia una interfaz directa, intuitiva y corporativa orientada a la productividad del personal de recepción y mantenimiento, cumpliendo con los estándares visuales de usabilidad corporativa.

## e) Se ha verificado el funcionamiento del ERP-CRM.

**Aplicación en el proyecto:** Se ha comprobado la correcta conectividad con la base de datos SQLite y verificado el funcionamiento completo del patrón CRUD (*Create, Read, Update, Delete*) en todas las entidades del sistema (habitaciones, clientes, reservas, mantenimiento e inventario). Se realizaron pruebas de inserción y modificación de registros comprobando la correcta retroalimentación visual de errores y la persistencia de los datos.

## f) Se han documentado las operaciones realizadas y las incidencias.

**Aplicación en el proyecto:** Se han documentado los pasos de configuración del entorno, la resolución de incidencias técnicas críticas (como los bloqueos de permisos de escritura en la base de datos SQLite y los errores por claves duplicadas) y la estructura de diseño e integración del código frontal y backend.

---

## Visión a Futuro y Líneas de Desarrollo (Evolución del Proyecto)

Como ampliación y mejora de cara al futuro del sistema, se contempla la evolución de la plataforma hacia un modelo de Control de Acceso Basado en Roles (RBAC) y flujos avanzados propios de un PMS profesional:

### Adaptación por Roles de Usuario

Restringir el acceso a las ventanas y módulos según el perfil del empleado (por ejemplo, que el personal de limpieza o mantenimiento solo visualice tickets y tareas asignadas, mientras que la dirección o recepción controle la gestión completa de reservas y clientes).

### Flujo Operativo de Habitaciones

Implementar una vista de mapa de habitaciones en tiempo real con cambios de estado automatizados y sincronizados con la operativa del hotel.

### Integración CRM Avanzada

Ampliar la ficha de clientes para registrar preferencias de estancia, histórico de estancias anteriores y automatización de avisos operativos entre departamentos.
