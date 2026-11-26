<?php
// Consultas sobre las vistas: clientes que más gastan y países de procedencia
//   GET 009-consultas.php
require_once '001-comun.php';

exigir_rol(['admin', 'recepcion']);
$db = abrir_bd();

responder([
    'ok' => true,
    'clientes' => consultar($db, 'SELECT * FROM v_clientes_resumen ORDER BY gasto DESC LIMIT 50'),
    'paises' => consultar($db, 'SELECT * FROM v_paises ORDER BY ingresos DESC'),
]);
