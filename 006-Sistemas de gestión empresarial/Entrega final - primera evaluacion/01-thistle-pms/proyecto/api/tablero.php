<?php
// Datos del tablero de recepción: estado de las habitaciones, llegadas, salidas y calendario
//   GET tablero.php?dias=14
// Todos los roles pueden ver el estado de las habitaciones, pero solo recepción ve los nombres de los huéspedes.

require_once 'comun.php';

$usuario = exigir_rol(['admin', 'recepcion', 'limpieza', 'mantenimiento']);
$ve_huespedes = in_array($usuario['rol'], ['admin', 'recepcion']);
$db = abrir_bd();
$hoy = date('Y-m-d');

$dias = (int)($_GET['dias'] ?? 14);
if ($dias < 7 || $dias > 31) { $dias = 14; }

// ---------- Habitaciones ----------
$habitaciones = consultar($db, "SELECT h.id, h.numero, h.planta, h.tipo, h.capacidad, h.estado,
        (SELECT COUNT(*) FROM mantenimiento m WHERE m.habitacion_id = h.id AND m.tipo = 'averia' AND m.estado <> 'resuelto') AS averias,
        (SELECT COUNT(*) FROM mantenimiento m WHERE m.habitacion_id = h.id AND m.tipo = 'limpieza' AND m.estado <> 'resuelto') AS limpiezas
    FROM habitaciones h ORDER BY h.numero");

$resumen = ['disponible' => 0, 'ocupada' => 0, 'sucia' => 0, 'mantenimiento' => 0];
foreach ($habitaciones as $h) { $resumen[$h['estado']]++; }

$respuesta = ['ok' => true, 'hoy' => $hoy, 'rol' => $usuario['rol'], 'resumen' => $resumen,
    'habitaciones' => $habitaciones, 'llegadas' => [], 'salidas' => [], 'calendario' => null];

if ($ve_huespedes) {
    // Huésped que está ahora en cada habitación
    $actuales = consultar($db, "SELECT r.id, r.habitacion_id, r.fecha_salida, c.apellidos || ', ' || c.nombre AS cliente
        FROM reservas r JOIN clientes c ON c.id = r.cliente_id WHERE r.estado = 'check-in'");
    $por_habitacion = [];
    foreach ($actuales as $a) { $por_habitacion[$a['habitacion_id']] = $a; }
    foreach ($respuesta['habitaciones'] as &$h) {
        $a = $por_habitacion[$h['id']] ?? null;
        $h['huesped'] = $a['cliente'] ?? null;
        $h['reserva_id'] = $a['id'] ?? null;
        $h['salida'] = $a['fecha_salida'] ?? null;
    }
    unset($h);

    // Llegadas y salidas de hoy
    $respuesta['llegadas'] = consultar($db, "SELECT r.id, r.num_huespedes, h.numero AS habitacion, h.estado AS estado_habitacion,
            c.apellidos || ', ' || c.nombre AS cliente
        FROM reservas r JOIN habitaciones h ON h.id = r.habitacion_id JOIN clientes c ON c.id = r.cliente_id
        WHERE r.estado = 'confirmada' AND r.fecha_entrada = ? ORDER BY h.numero", [$hoy]);
    $respuesta['salidas'] = consultar($db, "SELECT r.id, r.num_huespedes, h.numero AS habitacion, c.apellidos || ', ' || c.nombre AS cliente, r.importe_total
        FROM reservas r JOIN habitaciones h ON h.id = r.habitacion_id JOIN clientes c ON c.id = r.cliente_id
        WHERE r.estado = 'check-in' AND r.fecha_salida = ? ORDER BY h.numero", [$hoy]);

    // Calendario: reservas activas que se ven en los próximos días
    $fin = sumar_dias($hoy, $dias);
    $reservas = consultar($db, "SELECT r.id, r.habitacion_id, r.fecha_entrada, r.fecha_salida, r.estado, c.apellidos AS cliente
        FROM reservas r JOIN clientes c ON c.id = r.cliente_id
        WHERE r.estado <> 'cancelada' AND r.fecha_entrada < ? AND r.fecha_salida > ?", [$fin, $hoy]);
    $respuesta['calendario'] = ['desde' => $hoy, 'dias' => $dias, 'reservas' => $reservas];
}

responder($respuesta);
