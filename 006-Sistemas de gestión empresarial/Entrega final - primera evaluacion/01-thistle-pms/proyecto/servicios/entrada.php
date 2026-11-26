<?php
// Entrada de datos: importa clientes desde un CSV (solo admin y recepción)
//   POST servicios/entrada.php   {"csv": "nombre;apellidos;dni_pasaporte;telefono;email;pais\n..."}
// Cada fila se valida: las correctas se guardan y las incorrectas se devuelven con su motivo.
require_once __DIR__ . '/../api/comun.php';

exigir_post();
exigir_rol(['admin', 'recepcion']);
$texto = entrada()['csv'] ?? '';
if (!is_string($texto) || trim($texto) === '') { fallar('El archivo está vacío'); }
if (strlen($texto) > 200000) { fallar('El archivo es demasiado grande (máximo 200 KB)'); }

$texto = ltrim($texto, "\xEF\xBB\xBF");    // quita la marca BOM si la hay
$lineas = explode("\n", str_replace(["\r\n", "\r"], "\n", trim($texto)));
if (count($lineas) > 501) { fallar('Máximo 500 clientes por importación'); }

$separador = strpos($lineas[0], ';') !== false ? ';' : ',';
$cabecera = array_map('trim', str_getcsv(array_shift($lineas), $separador, '"', '\\'));
foreach (['nombre', 'apellidos', 'dni_pasaporte'] as $obligatoria) {
    if (!in_array($obligatoria, $cabecera)) { fallar("Falta la columna '$obligatoria' en la primera línea"); }
}

$db = abrir_bd();
$insertados = 0;
$rechazados = [];
empezar_transaccion($db);
foreach ($lineas as $i => $linea) {
    $numero = $i + 2;    // número de línea en el archivo (la 1 es la cabecera)
    if (trim($linea) === '') { continue; }
    $valores = str_getcsv($linea, $separador, '"', '\\');
    if (count($valores) !== count($cabecera)) { $rechazados[] = ['linea' => $numero, 'motivo' => 'Número de columnas incorrecto']; continue; }
    $fila = array_combine($cabecera, array_map('trim', $valores));

    $motivo = null;
    foreach (['nombre', 'apellidos', 'dni_pasaporte'] as $obligatoria) {
        if (($fila[$obligatoria] ?? '') === '') { $motivo = "Falta $obligatoria"; }
    }
    foreach (['nombre', 'apellidos', 'dni_pasaporte', 'telefono', 'email', 'pais'] as $campo) {
        if (strlen($fila[$campo] ?? '') > 120) { $motivo = "$campo demasiado largo"; }
    }
    if ($motivo === null && ($fila['email'] ?? '') !== '' && !filter_var($fila['email'], FILTER_VALIDATE_EMAIL)) { $motivo = 'Email no válido'; }
    if ($motivo !== null) { $rechazados[] = ['linea' => $numero, 'motivo' => $motivo]; continue; }

    try {
        ejecutar($db, 'INSERT INTO clientes (nombre, apellidos, dni_pasaporte, telefono, email, pais) VALUES (?, ?, ?, ?, ?, ?)', [
            $fila['nombre'], $fila['apellidos'], $fila['dni_pasaporte'],
            ($fila['telefono'] ?? '') ?: null, ($fila['email'] ?? '') ?: null, ($fila['pais'] ?? '') ?: 'España']);
        $insertados++;
    } catch (Exception $error) {
        $rechazados[] = ['linea' => $numero, 'motivo' => mensaje_error($error)];
    }
}
auditar($db, 'importar clientes', "$insertados insertados, " . count($rechazados) . ' rechazados');
$db->exec('COMMIT');
responder(['ok' => true, 'insertados' => $insertados, 'rechazados' => $rechazados]);
