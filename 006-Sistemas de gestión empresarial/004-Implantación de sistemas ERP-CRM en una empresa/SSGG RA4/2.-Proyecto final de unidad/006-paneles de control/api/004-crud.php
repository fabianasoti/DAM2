<?php
// Tabla y formulario genéricos para las entidades definidas en 003-entidades.php
//   GET  004-crud.php?entidad=clientes             lista de registros y descripción de los campos
//   POST 004-crud.php?accion=guardar  {entidad, id?, datos}
//   POST 004-crud.php?accion=borrar   {entidad, id}

require_once '001-comun.php';
$entidades = require '003-entidades.php';

$accion = $_GET['accion'] ?? 'lista';

// Cada entidad solo se puede usar si existe en la lista y el rol tiene permiso
function buscar_entidad($entidades, $nombre, $permiso) {
    if (!is_string($nombre) || !isset($entidades[$nombre])) {
        fallar('Entidad no válida', 404);
    }
    exigir_rol($entidades[$nombre][$permiso]);
    return $entidades[$nombre];
}

// Comprueba el valor de un campo. Devuelve el valor limpio o lanza un mensaje de error
function limpiar_valor($campo, $valor) {
    [$clave, $tipo, $etiqueta, $requerido, $extra] = $campo;
    $valor = is_string($valor) ? trim($valor) : $valor;

    if ($valor === null || $valor === '') {
        if ($requerido) { throw new Exception("$etiqueta es obligatorio"); }
        return null;
    }
    if ($tipo === 'texto' || $tipo === 'email') {
        if (!is_string($valor) || strlen($valor) > 120) { throw new Exception("$etiqueta no es válido (máximo 120 caracteres)"); }
        if ($tipo === 'email' && !filter_var($valor, FILTER_VALIDATE_EMAIL)) { throw new Exception("$etiqueta no es un email válido"); }
        return $valor;
    }
    if ($tipo === 'numero') {
        if (!is_numeric($valor)) { throw new Exception("$etiqueta debe ser un número"); }
        $numero = !empty($extra['entero']) ? (int)$valor : (float)$valor;
        if (!empty($extra['entero']) && (float)$valor != $numero) { throw new Exception("$etiqueta debe ser un número entero"); }
        if (isset($extra['min']) && $numero < $extra['min']) { throw new Exception("$etiqueta no puede ser menor que " . $extra['min']); }
        if (isset($extra['max']) && $numero > $extra['max']) { throw new Exception("$etiqueta no puede ser mayor que " . $extra['max']); }
        return $numero;
    }
    if ($tipo === 'fecha') {
        if (!es_fecha($valor)) { throw new Exception("$etiqueta debe ser una fecha válida (AAAA-MM-DD)"); }
        return $valor;
    }
    if ($tipo === 'select') {
        if (!in_array((string)$valor, $extra['opciones'], true)) { throw new Exception("$etiqueta no es una opción válida"); }
        return ctype_digit((string)$valor) ? (int)$valor : $valor;
    }
    if ($tipo === 'fk') {
        if (!is_numeric($valor)) { throw new Exception("$etiqueta no es válido"); }
        return (int)$valor;
    }
    if ($tipo === 'password') {
        if (!is_string($valor) || strlen($valor) < 8 || strlen($valor) > 200) { throw new Exception('La contraseña debe tener entre 8 y 200 caracteres'); }
        return $valor;
    }
    throw new Exception("$etiqueta no es válido");
}

$db = abrir_bd();

// ---------- Lista ----------
if ($accion === 'lista') {
    $nombre = $_GET['entidad'] ?? '';
    $entidad = buscar_entidad($entidades, $nombre, 'leer');

    // Columnas que se envían (nunca la contraseña, ni cifrada)
    $columnas = ['id'];
    foreach ($entidad['campos'] as $c) {
        if ($c[1] !== 'password') { $columnas[] = $c[0]; }
    }
    $registros = consultar($db, 'SELECT ' . implode(', ', $columnas) . ' FROM ' . $nombre . ' ORDER BY ' . $entidad['orden'] . ' LIMIT 1000');

    // Para los campos que apuntan a otra tabla, se envía id => texto
    $relaciones = [];
    foreach ($entidad['campos'] as $c) {
        if ($c[1] === 'fk') {
            $filas = consultar($db, 'SELECT id, ' . $c[4]['texto'] . ' AS texto FROM ' . $c[4]['tabla']);
            foreach ($filas as $f) { $relaciones[$c[0]][$f['id']] = $f['texto']; }
        }
    }

    $usuario = usuario_actual();
    responder([
        'ok' => true,
        'entidad' => [
            'nombre' => $nombre,
            'etiqueta' => $entidad['etiqueta'],
            'campos' => $entidad['campos'],
            'puede_escribir' => in_array($usuario['rol'], $entidad['escribir']),
            'puede_borrar' => in_array($usuario['rol'], $entidad['borrar']),
        ],
        'registros' => $registros,
        'relaciones' => $relaciones,
    ]);
}

// ---------- Guardar (crear o editar) ----------
if ($accion === 'guardar') {
    exigir_post();
    $datos = entrada();
    $nombre = $datos['entidad'] ?? '';
    $entidad = buscar_entidad($entidades, $nombre, 'escribir');
    $id = isset($datos['id']) ? (int)$datos['id'] : 0;
    $recibidos = is_array($datos['datos'] ?? null) ? $datos['datos'] : [];

    // 1. Validación: si algo no es correcto, se explica con un mensaje claro
    try {
        $valores = [];
        foreach ($entidad['campos'] as $campo) {
            if (!empty($campo[4]['solo_lectura'])) { continue; }
            if ($campo[1] === 'password') {
                // Sin contraseña al editar = se mantiene la anterior
                $texto = trim((string)($recibidos['password'] ?? ''));
                if ($texto === '' && $id > 0) { continue; }
                if ($texto === '') { throw new Exception('La contraseña es obligatoria'); }
                $valores['password_hash'] = password_hash(limpiar_valor($campo, $texto), PASSWORD_DEFAULT);
                continue;
            }
            // Al editar, los campos que no llegan no se tocan
            if ($id > 0 && !array_key_exists($campo[0], $recibidos)) { continue; }
            $valor = $recibidos[$campo[0]] ?? null;
            // Al crear, algunos campos tienen un valor por defecto
            if ($id === 0 && ($valor === null || $valor === '') && isset($campo[4]['defecto'])) {
                $valor = $campo[4]['defecto'];
            }
            $valores[$campo[0]] = limpiar_valor($campo, $valor);
        }

        // Un administrador no puede quitarse a sí mismo el acceso
        $yo = usuario_actual();
        if ($nombre === 'usuarios' && $id === $yo['id']
            && ((isset($valores['activo']) && $valores['activo'] === 0) || (isset($valores['rol']) && $valores['rol'] !== 'admin'))) {
            throw new Exception('No puedes quitarte tu propio acceso de administrador');
        }
    } catch (Exception $error) {
        fallar($error->getMessage());
    }
    if (count($valores) === 0) {
        fallar('No hay nada que guardar');
    }

    // 2. Guardado: los errores de la base de datos se traducen
    try {
        if ($id > 0) {
            $asignaciones = implode(', ', array_map(fn($k) => "$k = ?", array_keys($valores)));
            $cambiadas = ejecutar($db, "UPDATE $nombre SET $asignaciones WHERE id = ?", array_merge(array_values($valores), [$id]));
            if ($cambiadas === 0) { fallar('El registro no existe', 404); }
        } else {
            $columnas = implode(', ', array_keys($valores));
            $marcas = implode(', ', array_fill(0, count($valores), '?'));
            ejecutar($db, "INSERT INTO $nombre ($columnas) VALUES ($marcas)", array_values($valores));
            $id = $db->lastInsertRowID();
        }
        auditar($db, 'guardar ' . $nombre, "id $id");
        responder(['ok' => true, 'id' => $id]);
    } catch (Exception $error) {
        fallar(mensaje_error($error));
    }
}

// ---------- Borrar ----------
if ($accion === 'borrar') {
    exigir_post();
    $datos = entrada();
    $nombre = $datos['entidad'] ?? '';
    buscar_entidad($entidades, $nombre, 'borrar');
    $id = (int)($datos['id'] ?? 0);

    $yo = usuario_actual();
    if ($nombre === 'usuarios' && $id === $yo['id']) {
        fallar('No puedes borrar tu propio usuario');
    }
    try {
        $borradas = ejecutar($db, "DELETE FROM $nombre WHERE id = ?", [$id]);
        if ($borradas === 0) { fallar('El registro no existe', 404); }
        auditar($db, 'borrar ' . $nombre, "id $id");
        responder(['ok' => true]);
    } catch (Exception $error) {
        fallar(mensaje_error($error));
    }
}

fallar('Acción no válida', 404);
