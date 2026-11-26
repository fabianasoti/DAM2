<?php
// Indicadores del dashboard. Todo sale de consultas SQL sobre los datos reales.
//   GET 008-kpis.php
//
// Ocupación = noches ocupadas / noches disponibles (habitaciones x días del mes)
// ADR       = ingresos / noches ocupadas          (precio medio por noche vendida)
// RevPAR    = ingresos / noches disponibles       (ingresos por habitación disponible)

require_once '001-comun.php';

exigir_rol(['admin', 'recepcion']);
$db = abrir_bd();
$hoy = date('Y-m-d');

$total_habitaciones = consultar_uno($db, 'SELECT COUNT(*) AS n FROM habitaciones')['n'];

// ---------- Hoy ----------
$estados = ['disponible' => 0, 'ocupada' => 0, 'sucia' => 0, 'mantenimiento' => 0];
foreach (consultar($db, 'SELECT estado, COUNT(*) AS n FROM habitaciones GROUP BY estado') as $f) {
    $estados[$f['estado']] = (int)$f['n'];
}
$llegadas = consultar_uno($db, "SELECT COUNT(*) AS n FROM reservas WHERE estado = 'confirmada' AND fecha_entrada = ?", [$hoy])['n'];
$salidas = consultar_uno($db, "SELECT COUNT(*) AS n FROM reservas WHERE estado = 'check-in' AND fecha_salida = ?", [$hoy])['n'];
$huespedes = consultar_uno($db, "SELECT COALESCE(SUM(num_huespedes), 0) AS n FROM reservas WHERE estado = 'check-in'")['n'];
$averias = consultar_uno($db, "SELECT COUNT(*) AS total, COALESCE(SUM(prioridad = 'urgente'), 0) AS urgentes
    FROM mantenimiento WHERE tipo = 'averia' AND estado <> 'resuelto'");

// ---------- Mes a mes (últimos 12 meses) ----------
// Para cada mes se cuentan las noches de cada reserva que caen dentro de ese mes
// y se reparte su importe en partes iguales entre sus noches
$mensual = consultar($db, "
    WITH RECURSIVE meses(inicio) AS (
        SELECT date('now', 'localtime', 'start of month', '-11 months')
        UNION ALL
        SELECT date(inicio, '+1 month') FROM meses WHERE inicio < date('now', 'localtime', 'start of month')
    )
    SELECT m.inicio AS mes,
        julianday(date(m.inicio, '+1 month')) - julianday(m.inicio) AS dias,
        COALESCE(SUM(MAX(0, julianday(MIN(r.fecha_salida, date(m.inicio, '+1 month'))) - julianday(MAX(r.fecha_entrada, m.inicio)))), 0) AS noches,
        COALESCE(SUM(MAX(0, julianday(MIN(r.fecha_salida, date(m.inicio, '+1 month'))) - julianday(MAX(r.fecha_entrada, m.inicio)))
            * r.importe_total / (julianday(r.fecha_salida) - julianday(r.fecha_entrada))), 0) AS ingresos
    FROM meses m
    LEFT JOIN reservas r ON r.estado <> 'cancelada'
        AND r.fecha_entrada < date(m.inicio, '+1 month') AND r.fecha_salida > m.inicio
    GROUP BY m.inicio ORDER BY m.inicio");
foreach ($mensual as &$m) {
    $disponibles = $total_habitaciones * $m['dias'];
    $m['noches'] = (int)$m['noches'];
    $m['ingresos'] = round($m['ingresos'], 2);
    $m['ocupacion'] = round($m['noches'] / $disponibles * 100, 1);
    $m['adr'] = $m['noches'] > 0 ? round($m['ingresos'] / $m['noches'], 2) : 0;
    $m['revpar'] = round($m['ingresos'] / $disponibles, 2);
}
unset($m);

// ---------- Por canal y por tipo de habitación (últimos 12 meses) ----------
$canales = consultar($db, "SELECT canal, COUNT(*) AS reservas, ROUND(SUM(importe_total), 2) AS ingresos
    FROM reservas WHERE estado <> 'cancelada' AND fecha_entrada >= date('now', 'localtime', '-12 months') AND fecha_entrada <= ?
    GROUP BY canal ORDER BY ingresos DESC", [$hoy]);
$tipos = consultar($db, "SELECT h.tipo, CAST(SUM(julianday(r.fecha_salida) - julianday(r.fecha_entrada)) AS INTEGER) AS noches,
        ROUND(SUM(r.importe_total), 2) AS ingresos
    FROM reservas r JOIN habitaciones h ON h.id = r.habitacion_id
    WHERE r.estado <> 'cancelada' AND r.fecha_entrada >= date('now', 'localtime', '-12 months') AND r.fecha_entrada <= ?
    GROUP BY h.tipo ORDER BY ingresos DESC", [$hoy]);

// ---------- Cancelaciones (últimos 12 meses) ----------
$cancelaciones = consultar_uno($db, "SELECT COUNT(*) AS total, COALESCE(SUM(estado = 'cancelada'), 0) AS canceladas
    FROM reservas WHERE fecha_entrada >= date('now', 'localtime', '-12 months') AND fecha_entrada <= ?", [$hoy]);

// ---------- Próximos 14 días ----------
$proximos = consultar($db, "
    WITH RECURSIVE dias(dia) AS (
        SELECT ? UNION ALL SELECT date(dia, '+1 day') FROM dias WHERE dia < date(?, '+13 day')
    )
    SELECT d.dia AS fecha,
        (SELECT COUNT(*) FROM reservas r WHERE r.estado <> 'cancelada' AND r.fecha_entrada <= d.dia AND d.dia < r.fecha_salida) AS ocupadas,
        (SELECT COUNT(*) FROM reservas r WHERE r.estado <> 'cancelada' AND r.fecha_entrada = d.dia) AS llegadas,
        (SELECT COUNT(*) FROM reservas r WHERE r.estado <> 'cancelada' AND r.fecha_salida = d.dia) AS salidas
    FROM dias d ORDER BY d.dia", [$hoy, $hoy]);

responder([
    'ok' => true,
    'hoy' => $hoy,
    'habitaciones' => $total_habitaciones,
    'ahora' => [
        'estados' => $estados,
        'ocupacion' => round($estados['ocupada'] / $total_habitaciones * 100, 1),
        'llegadas' => (int)$llegadas,
        'salidas' => (int)$salidas,
        'huespedes' => (int)$huespedes,
        'averias' => (int)$averias['total'],
        'urgentes' => (int)$averias['urgentes'],
    ],
    'mensual' => $mensual,
    'canales' => $canales,
    'tipos' => $tipos,
    'cancelaciones' => [
        'total' => (int)$cancelaciones['total'],
        'canceladas' => (int)$cancelaciones['canceladas'],
        'porcentaje' => $cancelaciones['total'] > 0 ? round($cancelaciones['canceladas'] / $cancelaciones['total'] * 100, 1) : 0,
    ],
    'proximos' => $proximos,
]);
