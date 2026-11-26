<?php
// Facturas
//   GET 010-facturas.php?accion=lista&mes=AAAA-MM
//   GET 010-facturas.php?accion=ver&id=
require_once '001-comun.php';

exigir_rol(['admin', 'recepcion']);
$db = abrir_bd();
$accion = $_GET['accion'] ?? 'lista';

if ($accion === 'lista') {
    $mes = $_GET['mes'] ?? date('Y-m');
    if (!es_fecha($mes . '-01')) { fallar('Mes no válido (AAAA-MM)'); }

    $filas = consultar($db, "SELECT * FROM v_facturas WHERE strftime('%Y-%m', fecha) = ? ORDER BY numero DESC", [$mes]);
    $totales = consultar_uno($db, "SELECT COUNT(*) AS facturas, ROUND(COALESCE(SUM(base), 0), 2) AS base,
            ROUND(COALESCE(SUM(iva), 0), 2) AS iva, ROUND(COALESCE(SUM(total), 0), 2) AS total
        FROM facturas WHERE strftime('%Y-%m', fecha) = ?", [$mes]);
    responder(['ok' => true, 'mes' => $mes, 'facturas' => $filas, 'totales' => $totales]);
}

if ($accion === 'ver') {
    $factura = consultar_uno($db, 'SELECT * FROM v_facturas WHERE id = ?', [(int)($_GET['id'] ?? 0)]);
    if ($factura === null) { fallar('La factura no existe', 404); }
    responder(['ok' => true, 'factura' => $factura, 'hotel' => configuracion()['hotel'] ?? '']);
}

fallar('Acción no válida', 404);
