<?php
// Salida de datos: descarga una tabla en CSV o JSON (solo con sesión iniciada)
//   GET servicios/003-salida.php?tabla=reservas&formato=csv
require_once __DIR__ . '/../api/001-comun.php';

// Qué tablas se pueden exportar y quién puede hacerlo
$permisos = [
    'clientes' => ['admin', 'recepcion'], 'habitaciones' => ['admin', 'recepcion'],
    'reservas' => ['admin', 'recepcion'], 'temporadas' => ['admin', 'recepcion'],
    'facturas' => ['admin', 'recepcion'],
    'mantenimiento' => ['admin', 'recepcion', 'mantenimiento'],
    'usuarios' => ['admin'], 'auditoria' => ['admin'],
];
$tabla = $_GET['tabla'] ?? '';
$formato = $_GET['formato'] ?? 'csv';
if (!isset($permisos[$tabla])) { fallar('Tabla no válida', 404); }
if (!in_array($formato, ['csv', 'json'])) { fallar('Formato no válido'); }
exigir_rol($permisos[$tabla]);

$db = abrir_bd();

// Todas las columnas menos la contraseña cifrada: nunca sale de la base de datos
$columnas = [];
foreach (consultar($db, "PRAGMA table_info($tabla)") as $c) {
    if ($c['name'] !== 'password_hash') { $columnas[] = $c['name']; }
}
$filas = consultar($db, 'SELECT ' . implode(', ', $columnas) . " FROM $tabla ORDER BY id");
auditar($db, 'exportar', "$tabla ($formato), " . count($filas) . ' filas');

if ($formato === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $tabla . '.json"');
    echo json_encode($filas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Evita que Excel interprete como fórmula un texto que empieza por = + - o @
function celda_segura($valor) {
    $texto = (string)($valor ?? '');
    $primero = substr(ltrim($texto), 0, 1);
    if (in_array($primero, ['=', '+', '@', '-']) && !is_numeric($texto)) {
        return "'" . $texto;
    }
    return $texto;
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $tabla . '.csv"');
echo "\xEF\xBB\xBF";    // para que Excel lea bien las tildes
$salida = fopen('php://output', 'w');
fputcsv($salida, $columnas, ';', '"', '\\');
foreach ($filas as $fila) {
    fputcsv($salida, array_map('celda_segura', $fila), ';', '"', '\\');
}
fclose($salida);
