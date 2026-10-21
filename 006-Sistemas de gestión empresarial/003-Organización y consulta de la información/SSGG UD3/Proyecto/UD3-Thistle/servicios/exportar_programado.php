<?php
/* =========================================================
   servicios/exportar_programado.php
   Extracción AUTOMÁTICA de datos mediante un proceso programado.

   Se ejecuta por línea de comandos (cron / Programador de tareas):
       php exportar_programado.php

   Genera en data/exportaciones/:
     - AAAA-MM-DD_HH-MM_<tabla>.csv   (uno por tabla)
     - AAAA-MM-DD_HH-MM_completo.json (copia de toda la base de datos)
     - log.txt                        (registro de cada ejecución: tablas, filas, segundos)
   Borra las exportaciones con más de 30 días.
   ========================================================= */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Este script solo se puede ejecutar desde la línea de comandos.');
}

const DIAS_RETENCION = 30;

$inicio  = microtime(true);
$rutaBD  = __DIR__ . '/../data/thistle.db';
$carpeta = __DIR__ . '/../data/exportaciones';

if (!file_exists($rutaBD)) {
    fwrite(STDERR, "No se encuentra la base de datos: $rutaBD\n");
    exit(1);
}
if (!is_dir($carpeta) && !mkdir($carpeta, 0775, true)) {
    fwrite(STDERR, "No se ha podido crear la carpeta: $carpeta\n");
    exit(1);
}

$db = new SQLite3($rutaBD, SQLITE3_OPEN_READONLY);
$db->enableExceptions(true);

$nombreSeguro = fn(string $n): string => '"' . str_replace('"', '""', $n) . '"';

// Evita que Excel interprete datos de la base como fórmulas
$celda = function ($valor) {
    $texto = (string)($valor ?? '');
    if (preg_match('/^[\s\x00-\x1f]*[=+@-]/', $texto) && !preg_match('/^-?\d+(?:[.,]\d+)?$/', trim($texto))) {
        return "'" . $texto;
    }
    return $texto;
};

$fecha = date('Y-m-d_H-i');
$completo = [];
$totalTablas = 0;
$totalFilas = 0;

$tablas = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");

while ($t = $tablas->fetchArray(SQLITE3_ASSOC)) {
    $nombre = $t['name'];
    $res = $db->query('SELECT * FROM ' . $nombreSeguro($nombre));

    // Cabecera tomada de la estructura (así las tablas vacías también la tienen)
    $cabecera = [];
    for ($i = 0; $i < $res->numColumns(); $i++) {
        $cabecera[] = $res->columnName($i);
    }

    $f = fopen("$carpeta/{$fecha}_{$nombre}.csv", 'w');
    fwrite($f, "\xEF\xBB\xBF"); // BOM para que Excel lea bien las tildes
    fputcsv($f, $cabecera, ';', '"', '\\');

    $filas = [];
    while ($fila = $res->fetchArray(SQLITE3_ASSOC)) {
        $filas[] = $fila;
        fputcsv($f, array_map($celda, $fila), ';', '"', '\\');
    }
    fclose($f);

    $completo[$nombre] = $filas;
    $totalTablas++;
    $totalFilas += count($filas);
}

file_put_contents(
    "$carpeta/{$fecha}_completo.json",
    json_encode($completo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);
$db->close();

// Limpieza de exportaciones antiguas
$borrados = 0;
foreach (glob("$carpeta/*.{csv,json}", GLOB_BRACE) as $archivo) {
    if (filemtime($archivo) < time() - DIAS_RETENCION * 86400) {
        unlink($archivo);
        $borrados++;
    }
}

// Registro de la ejecución (sirve como evidencia y para medir rendimiento)
$segundos = round(microtime(true) - $inicio, 3);
$linea = sprintf("[%s] %d tablas, %d registros, %s s, %d archivos antiguos borrados\n",
    date('Y-m-d H:i:s'), $totalTablas, $totalFilas, $segundos, $borrados);
file_put_contents("$carpeta/log.txt", $linea, FILE_APPEND);

echo $linea;