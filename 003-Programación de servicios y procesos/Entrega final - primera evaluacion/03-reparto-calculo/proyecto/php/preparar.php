<?php
// El maestro llama aquí: lee el CSV, lo parte en paquetes y crea la cola

require_once "comun.php";

$entrada = leer_entrada();

// Validamos lo que llega: siempre dentro de unos límites
$tamano = max(5, min(500, intval($entrada["tamano"] ?? 40)));
$carga = max(0, min(50000000, intval($entrada["carga"] ?? 2000000)));

if (!file_exists(CSV_VENTAS)) {
    responder(["ok" => false, "error" => "No existe datos/ventas.csv"]);
}

$archivo = fopen(CSV_VENTAS, "r");
$cabeceras = fgetcsv($archivo);

$filas = [];
$importeEsperado = 0;    // suma directa, para comprobar luego el resultado de los esclavos
$unidadesEsperadas = 0;

while (($valores = fgetcsv($archivo)) !== false) {
    if (count($valores) < count($cabeceras)) {
        continue;    // fila incompleta: la saltamos
    }
    $fila = array_combine($cabeceras, $valores);
    $filas[] = $fila;
    $importeEsperado += intval($fila["unidades"]) * intval($fila["precio_centimos"]);
    $unidadesEsperadas += intval($fila["unidades"]);
}
fclose($archivo);

// Partimos las filas en paquetes
$trozos = array_chunk($filas, $tamano);
$paquetes = [];

foreach ($trozos as $i => $trozo) {
    $paquetes[] = [
        "id" => $i + 1,
        "estado" => "pendiente",
        "esclavo" => null,
        "asignado_en" => null,
        "terminado_en" => null,
        "segundos" => null,
        "intentos" => 0,
        "carga" => $carga,
        "datos" => $trozo,
        "resultado" => null
    ];
}

$cola = [
    "inicio" => time(),
    "esperado" => ["importe" => $importeEsperado, "unidades" => $unidadesEsperadas],
    "paquetes" => $paquetes
];

$f = abrir_cola();
flock($f, LOCK_EX);
escribir_cola($f, $cola);
flock($f, LOCK_UN);
fclose($f);

responder([
    "ok" => true,
    "filas" => count($filas),
    "paquetes" => count($paquetes),
    "tamano" => $tamano,
    "carga" => $carga
]);
?>
