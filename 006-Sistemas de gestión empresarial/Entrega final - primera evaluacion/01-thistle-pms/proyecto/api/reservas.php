<?php
// Reservas: disponibilidad, creación con validación, y cambios de estado (check-in, check-out, cancelar)
//   GET  reservas.php?accion=lista        filtros opcionales: estado, canal, desde, hasta, q
//   GET  reservas.php?accion=ver&id=
//   GET  reservas.php?accion=disponibles&entrada=&salida=&huespedes=
//   POST reservas.php?accion=crear        {habitacion_id, cliente_id, fecha_entrada, fecha_salida, num_huespedes, canal}
//   POST reservas.php?accion=estado       {id, estado}

require_once 'comun.php';

$usuario = exigir_rol(['admin', 'recepcion']);
$db = abrir_bd();
$accion = $_GET['accion'] ?? 'lista';
$hoy = date('Y-m-d');

const ESTADOS = ['confirmada', 'check-in', 'check-out', 'cancelada'];
const CANALES = ['directo', 'web', 'agencia', 'telefono'];
const MAX_NOCHES = 30;

// Corta la operación: deshace lo que se hubiera hecho en la transacción y avisa del motivo
function rechazar($db, $mensaje, $codigo = 409) {
    $db->exec('ROLLBACK');
    fallar($mensaje, $codigo);
}

// Comprueba las fechas de una estancia. Devuelve un mensaje de error o null si todo es correcto
function error_en_fechas($entrada, $salida, $hoy) {
    if (!es_fecha($entrada) || !es_fecha($salida)) { return 'Las fechas no son válidas (AAAA-MM-DD)'; }
    if ($salida <= $entrada) { return 'La salida debe ser posterior a la entrada'; }
    if ($entrada < $hoy) { return 'La fecha de entrada no puede ser anterior a hoy'; }
    if (contar_noches($entrada, $salida) > MAX_NOCHES) { return 'La estancia no puede superar ' . MAX_NOCHES . ' noches'; }
    if ($entrada > sumar_dias($hoy, 540)) { return 'No se admiten reservas con más de 18 meses de antelación'; }
    return null;
}

// ¿Hay otra reserva activa de esta habitación que se pise con estas fechas?
function hay_solape($db, $habitacion_id, $entrada, $salida, $ignorar_id = 0) {
    $fila = consultar_uno($db, "SELECT COUNT(*) AS n FROM reservas
        WHERE habitacion_id = ? AND estado <> 'cancelada' AND id <> ?
          AND fecha_entrada < ? AND ? < fecha_salida",
        [$habitacion_id, $ignorar_id, $salida, $entrada]);
    return $fila['n'] > 0;
}

// ---------- Lista con filtros ----------
if ($accion === 'lista') {
    $donde = ['1 = 1'];
    $parametros = [];
    $estado = $_GET['estado'] ?? '';
    if ($estado !== '') {
        if (!in_array($estado, ESTADOS)) { fallar('Estado no válido'); }
        $donde[] = 'r.estado = ?'; $parametros[] = $estado;
    }
    $canal = $_GET['canal'] ?? '';
    if ($canal !== '') {
        if (!in_array($canal, CANALES)) { fallar('Canal no válido'); }
        $donde[] = 'r.canal = ?'; $parametros[] = $canal;
    }
    foreach (['desde' => 'r.fecha_salida >= ?', 'hasta' => 'r.fecha_entrada <= ?'] as $clave => $condicion) {
        $valor = $_GET[$clave] ?? '';
        if ($valor !== '') {
            if (!es_fecha($valor)) { fallar('La fecha de "' . $clave . '" no es válida'); }
            $donde[] = $condicion; $parametros[] = $valor;
        }
    }
    $texto = trim($_GET['q'] ?? '');
    if ($texto !== '') {
        $donde[] = "(c.nombre || ' ' || c.apellidos LIKE ? OR h.numero LIKE ?)";
        $parametros[] = '%' . $texto . '%'; $parametros[] = $texto . '%';
    }
    $filas = consultar($db, "SELECT r.id, r.fecha_entrada, r.fecha_salida, r.estado, r.canal, r.importe_total, r.num_huespedes,
            r.habitacion_id, r.cliente_id, h.numero AS habitacion, h.tipo, c.nombre || ' ' || c.apellidos AS cliente
        FROM reservas r
        JOIN habitaciones h ON h.id = r.habitacion_id
        JOIN clientes c ON c.id = r.cliente_id
        WHERE " . implode(' AND ', $donde) . "
        ORDER BY r.fecha_entrada DESC, r.id DESC LIMIT 300", $parametros);
    responder(['ok' => true, 'reservas' => $filas, 'hoy' => $hoy]);
}

// ---------- Detalle de una reserva ----------
if ($accion === 'ver') {
    $reserva = consultar_uno($db, "SELECT r.*, h.numero AS habitacion, h.tipo, h.planta, h.estado AS estado_habitacion,
            c.nombre || ' ' || c.apellidos AS cliente, c.telefono, c.email
        FROM reservas r
        JOIN habitaciones h ON h.id = r.habitacion_id
        JOIN clientes c ON c.id = r.cliente_id
        WHERE r.id = ?", [(int)($_GET['id'] ?? 0)]);
    if ($reserva === null) { fallar('La reserva no existe', 404); }
    $reserva['noches'] = contar_noches($reserva['fecha_entrada'], $reserva['fecha_salida']);
    // Qué cambios de estado se pueden hacer ahora
    $permitidas = [];
    if ($reserva['estado'] === 'confirmada') { $permitidas = ['check-in', 'cancelada']; }
    if ($reserva['estado'] === 'check-in') { $permitidas = ['check-out']; }
    responder(['ok' => true, 'reserva' => $reserva, 'permitidas' => $permitidas, 'hoy' => $hoy]);
}

// ---------- Habitaciones disponibles para unas fechas, con su precio ----------
if ($accion === 'disponibles') {
    $entrada = $_GET['entrada'] ?? '';
    $salida = $_GET['salida'] ?? '';
    $huespedes = (int)($_GET['huespedes'] ?? 1);
    $error = error_en_fechas($entrada, $salida, $hoy);
    if ($error !== null) { fallar($error); }
    if ($huespedes < 1 || $huespedes > 6) { fallar('El número de huéspedes debe estar entre 1 y 6'); }

    // Se excluyen las habitaciones bloqueadas por avería y las que ya tienen una reserva que se pisa
    $habitaciones = consultar($db, "SELECT h.id, h.numero, h.planta, h.tipo, h.capacidad, h.precio_noche
        FROM habitaciones h
        WHERE h.estado <> 'mantenimiento' AND h.capacidad >= ?
          AND NOT EXISTS (
            SELECT 1 FROM reservas r
            WHERE r.habitacion_id = h.id AND r.estado <> 'cancelada'
              AND r.fecha_entrada < ? AND ? < r.fecha_salida)
        ORDER BY h.precio_noche, h.numero", [$huespedes, $salida, $entrada]);
    foreach ($habitaciones as &$h) {
        $h['importe'] = calcular_importe($db, $h['id'], $entrada, $salida);
    }
    responder(['ok' => true, 'noches' => contar_noches($entrada, $salida), 'habitaciones' => $habitaciones]);
}

// ---------- Crear una reserva ----------
if ($accion === 'crear') {
    exigir_post();
    $d = entrada();
    $habitacion_id = (int)($d['habitacion_id'] ?? 0);
    $cliente_id = (int)($d['cliente_id'] ?? 0);
    $entrada = $d['fecha_entrada'] ?? '';
    $salida = $d['fecha_salida'] ?? '';
    $huespedes = (int)($d['num_huespedes'] ?? 0);
    $canal = $d['canal'] ?? '';

    $error = error_en_fechas($entrada, $salida, $hoy);
    if ($error !== null) { fallar($error); }
    if (!in_array($canal, CANALES)) { fallar('El canal de reserva no es válido'); }
    if ($huespedes < 1) { fallar('Indica el número de huéspedes'); }

    // La transacción bloquea la base de datos: dos recepcionistas no pueden reservar a la vez la misma habitación
    empezar_transaccion($db);
    try {
        $habitacion = consultar_uno($db, 'SELECT id, numero, estado, capacidad FROM habitaciones WHERE id = ?', [$habitacion_id]);
        if ($habitacion === null) { rechazar($db, 'La habitación no existe', 404); }
        if ($habitacion['estado'] === 'mantenimiento') { rechazar($db, 'La habitación está bloqueada por una avería'); }
        if ($huespedes > $habitacion['capacidad']) { rechazar($db, 'La habitación ' . $habitacion['numero'] . ' admite como máximo ' . $habitacion['capacidad'] . ' huéspedes'); }
        if (consultar_uno($db, 'SELECT id FROM clientes WHERE id = ?', [$cliente_id]) === null) { rechazar($db, 'El cliente no existe', 404); }
        if (hay_solape($db, $habitacion_id, $entrada, $salida)) { rechazar($db, 'La habitación ya está reservada en esas fechas'); }

        $importe = calcular_importe($db, $habitacion_id, $entrada, $salida);
        ejecutar($db, "INSERT INTO reservas (habitacion_id, cliente_id, fecha_entrada, fecha_salida, num_huespedes, canal, estado, importe_total)
                       VALUES (?, ?, ?, ?, ?, ?, 'confirmada', ?)",
            [$habitacion_id, $cliente_id, $entrada, $salida, $huespedes, $canal, $importe]);
        $id = $db->lastInsertRowID();
        auditar($db, 'crear reserva', "id $id, habitación " . $habitacion['numero'] . ", $entrada a $salida");
        $db->exec('COMMIT');
        responder(['ok' => true, 'id' => $id, 'importe' => $importe, 'noches' => contar_noches($entrada, $salida)], 201);
    } catch (Exception $error) {
        $db->exec('ROLLBACK');
        fallar(mensaje_error($error), 409);
    }
}

// ---------- Cambiar el estado: check-in, check-out o cancelar ----------
if ($accion === 'estado') {
    exigir_post();
    $d = entrada();
    $id = (int)($d['id'] ?? 0);
    $nuevo = $d['estado'] ?? '';
    if (!in_array($nuevo, ['check-in', 'check-out', 'cancelada'])) { fallar('Estado no válido'); }

    empezar_transaccion($db);
    try {
        $reserva = consultar_uno($db, 'SELECT * FROM reservas WHERE id = ?', [$id]);
        if ($reserva === null) { rechazar($db, 'La reserva no existe', 404); }
        $habitacion = consultar_uno($db, 'SELECT id, numero, estado FROM habitaciones WHERE id = ?', [$reserva['habitacion_id']]);
        $actual = $reserva['estado'];

        // Solo se permiten estos recorridos: confirmada -> check-in -> check-out, y confirmada -> cancelada
        $permitido = ($actual === 'confirmada' && ($nuevo === 'check-in' || $nuevo === 'cancelada'))
            || ($actual === 'check-in' && $nuevo === 'check-out');
        if (!$permitido) { rechazar($db, "No se puede pasar una reserva de '$actual' a '$nuevo'"); }

        if ($nuevo === 'check-in') {
            if ($reserva['fecha_entrada'] > $hoy) { rechazar($db, 'Todavía no es el día de entrada (' . $reserva['fecha_entrada'] . ')'); }
            if ($reserva['fecha_salida'] <= $hoy) { rechazar($db, 'La fecha de salida de esta reserva ya ha pasado'); }
            // La habitación tiene que estar lista para recibir al huésped
            $motivos = [
                'ocupada' => 'La habitación ' . $habitacion['numero'] . ' sigue ocupada: hay que hacer antes el check-out del huésped anterior',
                'sucia' => 'La habitación ' . $habitacion['numero'] . ' está sucia: falta la limpieza',
                'mantenimiento' => 'La habitación ' . $habitacion['numero'] . ' está en mantenimiento',
            ];
            if (isset($motivos[$habitacion['estado']])) { rechazar($db, $motivos[$habitacion['estado']]); }
            ejecutar($db, "UPDATE reservas SET estado = 'check-in' WHERE id = ?", [$id]);
            ejecutar($db, "UPDATE habitaciones SET estado = 'ocupada' WHERE id = ?", [$habitacion['id']]);
        }

        if ($nuevo === 'check-out') {
            // Si el huésped se va antes de lo previsto, la estancia se acorta y se recalcula el importe
            if ($reserva['fecha_salida'] > $hoy) {
                $salida = max($hoy, sumar_dias($reserva['fecha_entrada'], 1));
                $importe = calcular_importe($db, $reserva['habitacion_id'], $reserva['fecha_entrada'], $salida);
                ejecutar($db, "UPDATE reservas SET fecha_salida = ?, importe_total = ? WHERE id = ?", [$salida, $importe, $id]);
            }
            ejecutar($db, "UPDATE reservas SET estado = 'check-out' WHERE id = ?", [$id]);
            ejecutar($db, "UPDATE habitaciones SET estado = 'sucia' WHERE id = ?", [$habitacion['id']]);
            // La habitación sucia genera un parte de limpieza (si no hay ya uno pendiente)
            $pendiente = consultar_uno($db, "SELECT id FROM mantenimiento WHERE habitacion_id = ? AND tipo = 'limpieza' AND estado <> 'resuelto'", [$habitacion['id']]);
            if ($pendiente === null) {
                ejecutar($db, "INSERT INTO mantenimiento (habitacion_id, tipo, descripcion, prioridad) VALUES (?, 'limpieza', 'Limpieza completa tras la salida', 'media')", [$habitacion['id']]);
            }
        }

        if ($nuevo === 'cancelada') {
            ejecutar($db, "UPDATE reservas SET estado = 'cancelada' WHERE id = ?", [$id]);
        }

        auditar($db, $nuevo, 'reserva ' . $id . ', habitación ' . $habitacion['numero']);
        $resultado = consultar_uno($db, 'SELECT estado FROM habitaciones WHERE id = ?', [$habitacion['id']]);
        $db->exec('COMMIT');
        responder(['ok' => true, 'estado' => $nuevo, 'estado_habitacion' => $resultado['estado']]);
    } catch (Exception $error) {
        $db->exec('ROLLBACK');
        fallar(mensaje_error($error), 409);
    }
}

fallar('Acción no válida', 404);
