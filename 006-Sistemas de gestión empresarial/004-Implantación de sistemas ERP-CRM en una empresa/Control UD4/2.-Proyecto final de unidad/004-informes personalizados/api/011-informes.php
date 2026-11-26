<?php
// Datos para los informes imprimibles
//   GET 011-informes.php?accion=parte&fecha=AAAA-MM-DD     parte diario de recepción
//   GET 011-informes.php?accion=mensual&mes=AAAA-MM        resumen de facturación del mes
//   GET 011-informes.php?accion=factura&id=                una factura con los datos del emisor
require_once '001-comun.php';

exigir_rol(['admin', 'recepcion']);
$db = abrir_bd();
$accion = $_GET['accion'] ?? 'parte';
$config = configuracion();
$comun = ['ok' => true, 'hotel' => $config['hotel'] ?? '', 'emisor' => $config['emisor'] ?? []];

if ($accion === 'parte') {
    $fecha = $_GET['fecha'] ?? date('Y-m-d');
    if (!es_fecha($fecha)) { fallar('Fecha no válida'); }
    $base = "SELECT * FROM v_reservas_detalle WHERE estado <> 'cancelada' AND ";
    responder($comun + [
        'fecha' => $fecha,
        'llegadas' => consultar($db, $base . 'fecha_entrada = ? ORDER BY habitacion', [$fecha]),
        'salidas' => consultar($db, $base . 'fecha_salida = ? ORDER BY habitacion', [$fecha]),
        'alojados' => consultar($db, $base . 'fecha_entrada <= ? AND ? < fecha_salida ORDER BY habitacion', [$fecha, $fecha]),
    ]);
}

if ($accion === 'mensual') {
    $mes = $_GET['mes'] ?? date('Y-m');
    if (!es_fecha($mes . '-01')) { fallar('Mes no válido (AAAA-MM)'); }
    $sumas = 'COUNT(*) AS facturas, ROUND(COALESCE(SUM(base), 0), 2) AS base,
              ROUND(COALESCE(SUM(iva), 0), 2) AS iva, ROUND(COALESCE(SUM(total), 0), 2) AS total';
    $filtro = "FROM v_facturas WHERE strftime('%Y-%m', fecha) = ?";
    responder($comun + [
        'mes' => $mes,
        'totales' => consultar_uno($db, "SELECT $sumas $filtro", [$mes]),
        'por_tipo' => consultar($db, "SELECT tipo, SUM(noches) AS noches, $sumas $filtro GROUP BY tipo ORDER BY total DESC", [$mes]),
        'por_pago' => consultar($db, "SELECT forma_pago, $sumas $filtro GROUP BY forma_pago ORDER BY total DESC", [$mes]),
    ]);
}

if ($accion === 'factura') {
    $factura = consultar_uno($db, 'SELECT * FROM v_facturas WHERE id = ?', [(int)($_GET['id'] ?? 0)]);
    if ($factura === null) { fallar('La factura no existe', 404); }
    responder($comun + ['factura' => $factura]);
}

fallar('Acción no válida', 404);
