# Resultados de Aprendizaje 3

### a) Se han utilizado herramientas y lenguajes de consulta y manipulación de datos proporcionados por los sistemas ERP-CRM.

Para la gestión de la información en el sistema Thistle se ha empleado SQL ANSI integrado sobre una base de datos relacional SQLite3, gestionada a través del script backend superapi.php. La manipulación de datos se efectúa mediante operaciones CRUD dinámicas que procesan sentencias de selección, inserción, actualización y borrado parametrizadas para evitar vulnerabilidades de inyección SQL. En la capa cliente, los módulos codigo.js y tabla.js transforman las respuestas JSON recibidas desde la API en estructuras de datos manipulables en tiempo real, permitiendo filtrados, ordenaciones e iteraciones sobre la información sin recargar la interfaz web.

### b) Se han generado formularios.

La creación e interacción con los datos del ERP se realiza a través del módulo dinamizador de formularios nucleo/formulario.js. Este componente se encarga de construir campos de entrada de datos tales como cajas de texto, desplegables y áreas de texto de forma automatizada mediante la lectura de los metadatos de la base de datos contenidos en schema.sql. Además de generar los controles, el módulo incluye una capa de validación en el lado del cliente para verificar que los datos ingresados cumplan con las restricciones del esquema antes de su envío, soportando de forma transparente tanto la inserción de nuevos registros como la modificación de entidades existentes.

### c) Se han generado informes.

El análisis de la información del sistema se organiza a través de los componentes nucleo/dashboard.js y nucleo/reporting.js, los cuales agregan métricas clave e indicadores de rendimiento (KPIs) en resúmenes ejecutivos orientados a la toma de decisiones. Como extensión visual respecto a las prácticas base, se ha integrado el módulo nucleo/graficas.js utilizando la librería Chart.js sobre elementos HTML5 Canvas. Esta extensión añade múltiples representaciones gráficas interactivas como diagramas de barras, líneas, tartas, dónuts y gráficos de radar, permitiendo analizar de forma detallada aspectos como las tendencias de ventas o el comportamiento de la cartera de clientes.

### d) Se han exportado datos e informes.

La extracción de información desde el ERP se ha resuelto mediante el módulo nucleo/csv.js, ampliado para cubrir múltiples formatos de salida que van más allá del formato CSV básico. El sistema permite transformar los datos de las tablas e informes a formatos estándar como CSV delimitado para hojas de cálculo, documentos en Markdown (MD) para texto estructurado, tablas estáticas en HTML para informes imprimibles, así como estructuras JSON y XML para facilitar la interoperabilidad con otros sistemas externos.

### e) Se han automatizado las extracciones de datos mediante procesos.

La ejecución desatendida de tareas y la sincronización de la información se gestionan a través de los scripts contenidos dentro de la carpeta /servicios/. En concreto, el script exportar_programado.php actúa como un proceso en segundo plano (susceptible de configurarse mediante un cronjob) que realiza extracciones automáticas de la información y genera historiales periódicos de informes. Por su parte, los endpoints entrada.php y salida.php funcionan como canal de comunicación para el procesamiento e ingesta de datos masivos en lote.

### f) Se ha verificado el rendimiento del sistema ERP-CRM.

Para evaluar el comportamiento del sistema ante volúmenes de trabajo reales se ha integrado el conjunto de datos de prueba data/demo.sql. El rendimiento de las consultas sobre SQLite se ha optimizado mediante la definición de índices estratégicos dentro del archivo schema.sql. Asimismo, en el lado de la interfaz, el archivo codigo.js hace uso de peticiones asíncronas a través de la API fetch, lo que garantiza que las consultas extensas y las operaciones con la base de datos se ejecuten sin bloquear el renderizado ni la experiencia de usuario en el navegador.

### g) Se han documentado las operaciones realizadas y las incidencias observadas.

Toda la estructura técnica del proyecto se encuentra documentada en el archivo INSTRUCCIONES_FUNCIONAMIENTO.txt, el cual detalla los pasos de configuración, requisitos e instrucciones de despliegue. Adicionalmente, el sistema incluye un asistente de instalación web compuesto por instalador.html y api/instalar.php que guía el proceso de inicialización de la base de datos, valida la creación del esquema definido en schema.sql y verifica los parámetros presentes en config.php.

h) Se ha obtenido información relevante a partir de los datos procesados.

La conversión de datos crudos en conocimiento útil para la gestión empresarial se realiza mediante la interacción conjunta entre dashboard.js y reporting.js. Estos módulos procesan, filtran y cruzan la información de las ventas, inventarios y clientes para mostrar análisis consolidados de volumen de negocio, rotación de productos e ingresos acumulados. Toda esta información procesada está disponible tanto para la visualización en directo mediante cuadros de mando interactivos como para su exportación a informes en distintos formatos técnicos y ejecutivos.


