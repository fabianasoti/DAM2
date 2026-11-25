<?php
// Funciones que usan todos los archivos PHP

// La cola se guarda en la carpeta temporal del sistema: así PHP siempre puede escribir
define("COLA", sys_get_temp_dir() . "/cola_reparto.json");
define("CSV_VENTAS", __DIR__ . "/../datos/ventas.csv");

// Segundos que esperamos a un esclavo antes de darle su paquete a otro
define("TIEMPO_MAXIMO", 30);

// Contesta en formato JSON y termina
function responder($datos) {
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Lee el JSON que nos envía el navegador
function leer_entrada() {
    $entrada = json_decode(file_get_contents("php://input"), true);
    return is_array($entrada) ? $entrada : [];
}

// Abre el archivo de la cola (si no existe, lo crea)
function abrir_cola() {
    $f = fopen(COLA, "c+");
    if (!$f) {
        responder(["ok" => false, "error" => "No se puede abrir la cola"]);
    }
    return $f;
}

// Lee la cola. Hay que haber hecho flock antes
function leer_cola($f) {
    rewind($f);
    $cola = json_decode(stream_get_contents($f), true);
    if (!is_array($cola) || !isset($cola["paquetes"])) {
        return ["inicio" => 0, "esperado" => null, "paquetes" => []];
    }
    return $cola;
}

// Escribe la cola entera. Hay que haber hecho flock antes
function escribir_cola($f, $cola) {
    rewind($f);
    ftruncate($f, 0);
    fwrite($f, json_encode($cola, JSON_UNESCAPED_UNICODE));
    fflush($f);
}

// El identificador del esclavo solo puede llevar letras, números, guion y guion bajo
function esclavo_valido($texto) {
    $sinSeparadores = str_replace(["-", "_"], "", $texto);
    return strlen($texto) >= 1 && strlen($texto) <= 40 && ctype_alnum($sinSeparadores);
}
?>
