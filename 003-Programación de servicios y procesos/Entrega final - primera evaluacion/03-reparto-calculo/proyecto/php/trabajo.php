<?php
// Un esclavo pide un paquete. Aquí está la parte crítica: el bloqueo con flock

require_once "comun.php";

$entrada = leer_entrada();
$esclavo = trim($entrada["esclavo"] ?? "");

if (!esclavo_valido($esclavo)) {
    responder(["trabajo" => false, "espera" => false, "mensaje" => "Identificador de esclavo no válido"]);
}

$f = abrir_cola();

// Mientras un PHP busca y reserva un paquete, ningún otro puede tocar la cola.
// Por eso dos esclavos nunca reciben el mismo paquete.
flock($f, LOCK_EX);

$cola = leer_cola($f);
$ahora = time();
$seleccionado = null;

foreach ($cola["paquetes"] as &$paquete) {
    $libre = $paquete["estado"] === "pendiente";

    // Un paquete asignado hace demasiado tiempo se considera perdido (esclavo cerrado o caído)
    $perdido = $paquete["estado"] === "asignado"
        && ($ahora - $paquete["asignado_en"]) > TIEMPO_MAXIMO;

    if ($libre || $perdido) {
        $paquete["estado"] = "asignado";
        $paquete["esclavo"] = $esclavo;
        $paquete["asignado_en"] = $ahora;
        $paquete["intentos"]++;

        $seleccionado = [
            "trabajo" => true,
            "id" => $paquete["id"],
            "carga" => $paquete["carga"],
            "datos" => $paquete["datos"]
        ];
        break;
    }
}
unset($paquete);

if ($seleccionado !== null) {
    escribir_cola($f, $cola);
}

flock($f, LOCK_UN);
fclose($f);

if ($seleccionado !== null) {
    responder($seleccionado);
}

// No hay paquete para este esclavo: ¿hay que esperar o ha terminado todo?
$quedan = false;
foreach ($cola["paquetes"] as $paquete) {
    if ($paquete["estado"] !== "terminado") {
        $quedan = true;
    }
}

if (count($cola["paquetes"]) === 0) {
    responder(["trabajo" => false, "espera" => true, "mensaje" => "El maestro todavía no ha preparado trabajo"]);
}
if ($quedan) {
    responder(["trabajo" => false, "espera" => true, "mensaje" => "No quedan paquetes libres, otros esclavos terminan los suyos"]);
}
responder(["trabajo" => false, "espera" => false, "mensaje" => "Todos los paquetes están terminados"]);
?>
