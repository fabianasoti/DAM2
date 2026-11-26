<?php
// Partes de mantenimiento (averías) y de limpieza
//   GET  mantenimiento.php?tipo=averia|limpieza&estado=abiertos|resuelto
//   POST mantenimiento.php?accion=crear     {habitacion_id, descripcion, prioridad}     (avería)
//   POST mantenimiento.php?accion=asignar   {id}      el usuario se asigna el parte y lo pone en proceso
//   POST mantenimiento.php?accion=resolver  {id}
//
// Quién puede qué:
//   averías:   las ven admin, recepcion y mantenimiento; las resuelven admin y mantenimiento
//   limpieza:  la ven admin, recepcion y limpieza;       la resuelven admin y limpieza
//   cualquier empleado puede avisar de una avería

require_once 'comun.php';

$usuario = exigir_rol(['admin', 'recepcion', 'mantenimiento', 'limpieza']);
$db = abrir_bd();
$accion = $_GET['accion'] ?? 'lista';

$ROLES_VER = ['averia' => ['admin', 'recepcion', 'mantenimiento'], 'limpieza' => ['admin', 'recepcion', 'limpieza']];
$ROLES_TRABAJAR = ['averia' => ['admin', 'mantenimiento'], 'limpieza' => ['admin', 'limpieza']];

function rechazar($db, $mensaje, $codigo = 409) {
    $db->exec('ROLLBACK');
    fallar($mensaje, $codigo);
}

// Tras resolver un parte, decide en qué estado queda la habitación
function actualizar_habitacion($db, $habitacion_id) {
    $habitacion = consultar_uno($db, 'SELECT estado FROM habitaciones WHERE id = ?', [$habitacion_id]);
    if ($habitacion['estado'] === 'ocupada') { return; }    // con huésped dentro no se cambia
    $averias = consultar_uno($db, "SELECT COUNT(*) AS n FROM mantenimiento
        WHERE habitacion_id = ? AND tipo = 'averia' AND estado <> 'resuelto' AND prioridad IN ('alta', 'urgente')", [$habitacion_id])['n'];
    $limpiezas = consultar_uno($db, "SELECT COUNT(*) AS n FROM mantenimiento
        WHERE habitacion_id = ? AND tipo = 'limpieza' AND estado <> 'resuelto'", [$habitacion_id])['n'];
    if ($averias > 0) { $nuevo = 'mantenimiento'; }
    elseif ($limpiezas > 0) { $nuevo = 'sucia'; }
    else { $nuevo = 'disponible'; }
    ejecutar($db, 'UPDATE habitaciones SET estado = ? WHERE id = ?', [$nuevo, $habitacion_id]);
}

// ---------- Lista ----------
if ($accion === 'lista') {
    $tipo = $_GET['tipo'] ?? 'averia';
    if (!isset($ROLES_VER[$tipo])) { fallar('Tipo no válido'); }
    exigir_rol($ROLES_VER[$tipo]);
    $condicion = ($_GET['estado'] ?? 'abiertos') === 'resuelto' ? "m.estado = 'resuelto'" : "m.estado <> 'resuelto'";
    $partes = consultar($db, "SELECT m.id, m.habitacion_id, h.numero AS habitacion, m.tipo, m.descripcion, m.prioridad, m.estado,
            m.fecha_creacion, m.fecha_resolucion, u.nombre AS asignado, m.usuario_id
        FROM mantenimiento m
        JOIN habitaciones h ON h.id = m.habitacion_id
        LEFT JOIN usuarios u ON u.id = m.usuario_id
        WHERE m.tipo = ? AND $condicion
        ORDER BY CASE m.prioridad WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END, m.fecha_creacion DESC
        LIMIT 200", [$tipo]);
    $puede = in_array($usuario['rol'], $ROLES_TRABAJAR[$tipo]);
    responder(['ok' => true, 'partes' => $partes, 'puede_trabajar' => $puede, 'yo' => $usuario['id']]);
}

// ---------- Avisar de una avería ----------
if ($accion === 'crear') {
    exigir_post();
    $d = entrada();
    $habitacion_id = (int)($d['habitacion_id'] ?? 0);
    $descripcion = trim((string)($d['descripcion'] ?? ''));
    $prioridad = $d['prioridad'] ?? '';
    if ($descripcion === '' || strlen($descripcion) > 200) { fallar('Describe la avería (máximo 200 caracteres)'); }
    if (!in_array($prioridad, ['baja', 'media', 'alta', 'urgente'])) { fallar('La prioridad no es válida'); }

    empezar_transaccion($db);
    try {
        $habitacion = consultar_uno($db, 'SELECT id, numero FROM habitaciones WHERE id = ?', [$habitacion_id]);
        if ($habitacion === null) { rechazar($db, 'La habitación no existe', 404); }
        ejecutar($db, "INSERT INTO mantenimiento (habitacion_id, tipo, descripcion, prioridad) VALUES (?, 'averia', ?, ?)",
            [$habitacion_id, $descripcion, $prioridad]);
        $id = $db->lastInsertRowID();
        actualizar_habitacion($db, $habitacion_id);    // una avería alta o urgente bloquea la habitación
        auditar($db, 'crear avería', 'habitación ' . $habitacion['numero'] . ', ' . $prioridad);
        $estado = consultar_uno($db, 'SELECT estado FROM habitaciones WHERE id = ?', [$habitacion_id])['estado'];
        $db->exec('COMMIT');
        responder(['ok' => true, 'id' => $id, 'estado_habitacion' => $estado], 201);
    } catch (Exception $error) {
        $db->exec('ROLLBACK');
        fallar(mensaje_error($error), 409);
    }
}

// ---------- Asignarse o resolver un parte ----------
if ($accion === 'asignar' || $accion === 'resolver') {
    exigir_post();
    $id = (int)(entrada()['id'] ?? 0);

    empezar_transaccion($db);
    try {
        $parte = consultar_uno($db, 'SELECT * FROM mantenimiento WHERE id = ?', [$id]);
        if ($parte === null) { rechazar($db, 'El parte no existe', 404); }
        if (!in_array($usuario['rol'], $ROLES_TRABAJAR[$parte['tipo']])) {
            rechazar($db, 'Tu rol no puede trabajar en partes de ' . ($parte['tipo'] === 'averia' ? 'averías' : 'limpieza'), 403);
        }
        if ($parte['estado'] === 'resuelto') { rechazar($db, 'Este parte ya está resuelto'); }

        if ($accion === 'asignar') {
            ejecutar($db, "UPDATE mantenimiento SET usuario_id = ?, estado = 'en_proceso' WHERE id = ?", [$usuario['id'], $id]);
        } else {
            ejecutar($db, "UPDATE mantenimiento SET estado = 'resuelto', usuario_id = COALESCE(usuario_id, ?), fecha_resolucion = CURRENT_TIMESTAMP WHERE id = ?",
                [$usuario['id'], $id]);
            actualizar_habitacion($db, $parte['habitacion_id']);
        }
        auditar($db, $accion . ' ' . $parte['tipo'], 'parte ' . $id);
        $estado = consultar_uno($db, 'SELECT estado FROM habitaciones WHERE id = ?', [$parte['habitacion_id']])['estado'];
        $db->exec('COMMIT');
        responder(['ok' => true, 'estado_habitacion' => $estado]);
    } catch (Exception $error) {
        $db->exec('ROLLBACK');
        fallar(mensaje_error($error), 409);
    }
}

fallar('Acción no válida', 404);
