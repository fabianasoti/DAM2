<?php
// Integración con otro sistema de gestión: darkorange (el ERP visto en clase)
// Thistle le envía por HTTP sus clientes y sus facturas.
// En darkorange una factura apunta a un pedido, un producto y un cliente,
// así que se crean en ese orden: cliente -> producto -> pedido -> factura.
//   GET  012-integracion.php                 estado: cuántas facturas faltan por enviar
//   POST 012-integracion.php?accion=enviar   envía las siguientes facturas pendientes
//
// Solo se envía lo necesario: nombre, apellidos y email (ni documento ni teléfono).
require_once '001-comun.php';

const LOTE = 25;     // facturas que se envían de cada vez

exigir_rol(['admin']);
$db = abrir_bd();
$ajustes = configuracion()['integracion'] ?? [];
$accion = $_GET['accion'] ?? 'estado';

// Llama a la API de darkorange. Devuelve su respuesta, o null si no contesta bien
function llamar_darkorange($ajustes, $ruta, $datos = null) {
    // $ruta puede llevar más parámetros, por ejemplo "tabla&tabla=productos"
    $url = ($ajustes['darkorange_url'] ?? '') . '?ruta=' . $ruta . '&proyecto=' . urlencode($ajustes['proyecto'] ?? '');
    $opciones = ['timeout' => 5, 'ignore_errors' => true];
    if ($datos !== null) {
        $opciones['method'] = 'POST';
        $opciones['header'] = 'Content-Type: application/json';
        $opciones['content'] = json_encode($datos, JSON_UNESCAPED_UNICODE);
    }
    $respuesta = @file_get_contents($url, false, stream_context_create(['http' => $opciones]));
    if ($respuesta === false) { return null; }
    $json = json_decode($respuesta, true);
    return (is_array($json) && !isset($json['error'])) ? $json : null;
}

// En darkorange cada tipo de habitación es un producto. Lo busca y, si no existe, lo crea
function producto_de($ajustes, $tipo) {
    $nombre = 'Alojamiento ' . $tipo;
    $tabla = llamar_darkorange($ajustes, 'tabla&tabla=productos');
    if ($tabla === null) { return null; }
    foreach ($tabla['registros'] as $producto) {
        if ($producto['nombre'] === $nombre) { return (int)$producto['id']; }
    }
    $alta = llamar_darkorange($ajustes, 'crear', ['tabla' => 'productos',
        'datos' => ['nombre' => $nombre, 'descripcion' => 'Noche de hotel (enviado desde Thistle PMS)']]);
    return $alta === null ? null : (int)$alta['id'];
}

function contar($db) {
    return consultar_uno($db, 'SELECT COALESCE(SUM(enviada IS NULL), 0) AS pendientes,
        COALESCE(SUM(enviada IS NOT NULL), 0) AS enviadas FROM facturas');
}

if ($accion === 'estado') {
    $tablas = llamar_darkorange($ajustes, 'entidades');
    responder(['ok' => true, 'url' => $ajustes['darkorange_url'] ?? '', 'conectado' => $tablas !== null] + contar($db));
}

if ($accion === 'enviar') {
    exigir_post();
    entrada();     // exige que la petición sea JSON
    if (llamar_darkorange($ajustes, 'entidades') === null) {
        fallar('No se puede conectar con darkorange. ¿Está arrancado?', 502);
    }

    $pendientes = consultar($db, 'SELECT f.id, f.numero, f.fecha, f.total, f.reserva_id, f.cliente_id,
            v.noches, v.tipo, v.fecha_entrada, c.nombre, c.apellidos, c.email
        FROM facturas f
        JOIN v_facturas v ON v.id = f.id
        JOIN clientes c ON c.id = f.cliente_id
        WHERE f.enviada IS NULL ORDER BY f.fecha DESC, f.id DESC LIMIT ' . LOTE);

    $enviadas = 0;
    $productos = [];     // tipo de habitación => id del producto en darkorange
    foreach ($pendientes as $f) {
        // 1. El cliente se da de alta una sola vez
        $cliente = consultar_uno($db, 'SELECT id_externo FROM clientes WHERE id = ?', [$f['cliente_id']]);
        $id_externo = $cliente['id_externo'];
        if ($id_externo === null) {
            $alta = llamar_darkorange($ajustes, 'crear', ['tabla' => 'clientes',
                'datos' => ['nombre' => $f['nombre'], 'apellidos' => $f['apellidos'], 'email' => (string)$f['email']]]);
            if ($alta === null) { break; }
            $id_externo = (int)$alta['id'];
            ejecutar($db, 'UPDATE clientes SET id_externo = ? WHERE id = ?', [$id_externo, $f['cliente_id']]);
        }
        // 2. El producto (uno por tipo de habitación)
        if (!isset($productos[$f['tipo']])) {
            $productos[$f['tipo']] = producto_de($ajustes, $f['tipo']);
        }
        $producto = $productos[$f['tipo']];
        if ($producto === null) { break; }

        // 3. El pedido (la reserva)
        $pedido = llamar_darkorange($ajustes, 'crear', ['tabla' => 'pedido', 'datos' => [
            'numerodepedido' => (string)$f['reserva_id'],
            'fecha' => $f['fecha_entrada'],
            'producto' => (string)$producto,
            'cliente' => (string)$id_externo,
        ]]);
        if ($pedido === null) { break; }

        // 4. La factura
        $alta = llamar_darkorange($ajustes, 'crear', ['tabla' => 'factura', 'datos' => [
            'numerodefactura' => $f['numero'],
            'fecha' => $f['fecha'],
            'valor' => (string)$f['total'],
            'cantidad' => (string)$f['noches'],
            'producto' => (string)$producto,
            'pedido' => (string)$pedido['id'],
            'cliente' => (string)$id_externo,
        ]]);
        if ($alta === null) { break; }
        ejecutar($db, "UPDATE facturas SET enviada = datetime('now', 'localtime') WHERE id = ?", [$f['id']]);
        $enviadas++;
    }

    auditar($db, 'enviar a darkorange', "$enviadas facturas");
    if ($enviadas < count($pendientes)) {
        fallar("Se enviaron $enviadas facturas, pero darkorange rechazó la siguiente", 502);
    }
    responder(['ok' => true, 'enviadas_ahora' => $enviadas] + contar($db));
}

fallar('Acción no válida', 404);
