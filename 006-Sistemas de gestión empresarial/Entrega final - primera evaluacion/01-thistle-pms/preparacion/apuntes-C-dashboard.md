# Aspecto C: Dashboard de indicadores hoteleros y extracción de datos

## 1. Resumen en 3 líneas
Un cuadro de mando con los indicadores que usa un hotel (ocupación, ADR y RevPAR) más ingresos por mes, por canal y por tipo de habitación, y la ocupación de los próximos 14 días. Cada cifra sale de una consulta SQL sobre las reservas reales y las gráficas son SVG hechas a mano. Los datos también se pueden extraer: descarga en CSV o JSON y una exportación programada con cron.

## 2. Mapa de archivos y recorrido
`js/dashboard.js` (tarjetas y gráficas) → `js/graficas.js` (barras, líneas y anillo en SVG) → `api/kpis.php` (consultas SQL) → `reservas` y `habitaciones`. Extracción: `servicios/salida.php` (descarga), `servicios/entrada.php` (importar clientes) y `servicios/exportar_programado.php` (cron, con registro y retención de 30 días).

## 3. Fragmentos clave
**C1. `api/kpis.php` líneas 32-48:** `WITH RECURSIVE meses` genera los últimos 12 meses y, para cada uno, se suman las noches de cada reserva que caen dentro del mes con `MIN(salida, fin_mes) − MAX(entrada, inicio_mes)`; el importe se reparte entre las noches de la reserva. Concepto: consulta analítica con CTE recursiva.

**C2. `api/kpis.php` líneas 49-55:** ocupación = noches ocupadas ÷ (habitaciones × días); ADR = ingresos ÷ noches ocupadas; RevPAR = ingresos ÷ noches disponibles. Concepto: indicadores de negocio (KPI) calculados desde los datos.

**C3. `api/kpis.php` líneas 72-83:** otra CTE recursiva genera los próximos 14 días, con subconsultas que cuentan ocupadas, llegadas y salidas. Concepto: subconsultas correlacionadas.

**C4. `js/graficas.js` líneas 40-64 (`barras`):** calcula un máximo "redondo" para el eje, dibuja la rejilla, una barra por valor y un `<title>` con su dato (se ve al pasar el ratón). Concepto: visualización de datos sin librerías.

**C5. `servicios/exportar_programado.php` líneas 60-100:** recorre las tablas, escribe un CSV por tabla y un JSON completo **sin contraseñas**, borra lo que tenga más de 30 días y apunta cada ejecución en `log.txt`. Concepto: extracción automática de datos.

## 4. Conceptos de la unidad aplicados
Consultas SQL de agregación y subconsultas; indicadores de gestión y cuadros de mando; informes y gráficas; procesos de extracción de datos (CSV, JSON, proceso programado); validación al importar. Visto en la unidad de organización y consulta de la información (consultas, informes, gráficos, extracción de datos y BI).

## 5. Decisiones técnicas
- **Calcular en SQL**, no en JavaScript: los datos no viajan enteros al navegador. Coste: consultas más complejas.
- **Repartir el importe entre noches** para atribuir bien los ingresos de estancias que cruzan dos meses.
- **Gráficas SVG propias** en lugar de una librería: ligeras y con los colores del manual. Coste: tipos limitados (barras, líneas, anillo).
- **Contar también las reservas confirmadas del mes en curso:** el mes actual refleja la ocupación prevista (lo dice la tarjeta).
- **Fórmula visible bajo cada gráfica:** quien la ve sabe cómo se calculó.
- **Exportar sin contraseñas y protegiendo fórmulas:** una celda que empieza por `=` se guarda como texto para que Excel no la ejecute.

## 6. Ejecución y datos
Entrar como admin o recepción → Informes → Dashboard o Exportar datos. Cron (ejemplo diario a las 3:00): `0 3 * * * php /ruta/servicios/exportar_programado.php`. Datos: unas 5000 reservas de un año. Validación al importar: columnas obligatorias, longitud, email, duplicados y máximo 500 filas por archivo.

## 7. Verificación (real)
- **Se contrastó con un cálculo independiente:** noches e ingresos de los 12 meses coinciden con otro cálculo hecho en Python noche a noche (por ejemplo, octubre: 1111 noches y noviembre: 855 en el momento de la prueba).
- RevPAR = ocupación × ADR (57 % × 89,1 € = 50,79 €). Estados de habitaciones y reservas por canal coinciden con la base de datos.
- `kpis.php` responde en **56 ms** de mediana (es la consulta más pesada); el resto de peticiones, entre 0,7 y 2,6 ms.
- CSV: una celda que empieza por `=` sale protegida; el JSON de usuarios no incluye contraseñas; tabla no permitida da 404.
- Importar: de 5 filas, 2 válidas y 3 rechazadas con su motivo (falta nombre, documento repetido, email no válido).
- Exportación programada: crea un CSV por tabla, un JSON y el registro en 0,019 s; no se puede ejecutar desde la web (403).
- Interfaz (navegador simulado): 9 tarjetas y 5 gráficas; la de ocupación tiene 12 barras con su valor. **Sin ver** el aspecto real.

## 8. Limitaciones y mejora
Los ingresos se reparten por igual entre noches (no por la tarifa real de cada noche); no hay filtros por fechas ni comparación con el año anterior; la consulta mensual tarda 56 ms con 5000 reservas y crecería con más datos. Mejora: tabla resumen precalculada y comparación interanual.

## 9. Chuleta de defensa
1. **¿Qué es el RevPAR?** Ingresos divididos entre las noches disponibles; equivale a ocupación por ADR.
2. **¿Cómo sabes que las cifras son correctas?** Se compararon los 12 meses con un cálculo independiente en Python, noche a noche.
3. **¿Por qué calculas en SQL?** Para no llevar todos los datos al navegador; la base de datos agrega mejor.
4. **¿Cómo sacas los datos del sistema?** CSV/JSON desde la aplicación y una exportación programada con registro y retención.
5. **¿Qué protección tiene la exportación?** Nunca exporta contraseñas y protege las celdas que Excel podría tomar como fórmulas.

## 10. Glosario
- **KPI:** indicador clave de gestión.
- **ADR:** precio medio por noche vendida.
- **RevPAR:** ingresos por habitación disponible.
- **Ocupación:** noches ocupadas entre noches disponibles.
- **CTE recursiva:** consulta que se llama a sí misma para generar filas (aquí, meses y días).
- **Extracción de datos:** sacar información del sistema a otros formatos.
- **Cron:** programador de tareas de Linux.
- **Retención:** cuánto tiempo se guardan las copias.

## 11. Piezas para el post
- **Intro:** la dirección de un hotel quiere saber cómo va el negocio sin montar hojas de cálculo (hipótesis).
- **Para qué sirve:** ocupación, ADR y RevPAR por mes; ingresos por canal; próximas dos semanas; exportar datos.
- **Técnica:** SQL con CTE recursivas; gráficas SVG propias; exportación programada sin contraseñas.
- **Verificación:** 12 meses contrastados con un cálculo independiente; 56 ms; RevPAR = ocupación × ADR.
- **Cierre:** ingresos repartidos por igual entre noches; mejora: comparación interanual.

## 12. EJEMPLO PARA ADAPTAR (post de 5 párrafos)
Quien dirige un hotel necesita responder preguntas muy concretas: cuánta gente ocupó las habitaciones el mes pasado, cuánto se cobró de media por noche y qué canal trae más ingresos. Si la respuesta está repartida en hojas de cálculo, cada pregunta es un rato de trabajo.

Hice un panel de indicadores para un sistema de gestión hotelera. Muestra la ocupación, el precio medio por noche y los ingresos por habitación disponible de los últimos doce meses, los ingresos por canal de venta y cuántas habitaciones habrá ocupadas durante las dos próximas semanas. Bajo cada gráfica aparece la fórmula, para saber de dónde sale cada cifra.

Todo se calcula con consultas SQL sobre las reservas reales: una consulta recursiva genera los meses y reparte el importe de cada reserva entre sus noches. Las gráficas están dibujadas a mano en SVG, sin librerías. Además, los datos se pueden exportar a CSV o JSON, nunca con las contraseñas, y una tarea programada hace una copia completa a diario con su registro.

Para fiarme de las cifras, comparé los doce meses con otro cálculo hecho aparte, noche a noche, y coincidían. También comprobé que el RevPAR es igual a la ocupación por el precio medio, y que el panel responde en unos cincuenta milisegundos con casi cinco mil reservas.

Los ingresos se reparten por igual entre las noches de una estancia y aún no se puede comparar con el año anterior. Es una versión inicial de un sistema que pienso ampliar. [Cierra con tu agradecimiento.]
