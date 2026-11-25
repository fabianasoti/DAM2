<?php
// Un esclavo entrega el resultado de su paquete

require_once "comun.php";

$entrada = leer_entrada();

$id = intval($entrada["id"] ?? 0);
$esclavo = trim($entrada["esclavo"] ?? "");
$resultado = $entrada["resultado"] ?? null;
$segundos = floatval($entrada["segundos"] ?? 0);

// Comprobamos que lo que llega tiene sentido
if ($id <= 0 || !esclavo_valido($esclavo) || !is_array($resultado)
    || !isset($resultado["ingresos"]) || !isset($resultado["unidades"])
    || !isset($resultado["importe_total"])) {
    responder(["ok" => false, "error" => "Resultado no válido"]);
}

$f = abrir_cola();
flock($f, LOCK_EX);

$cola = leer_cola($f);
$encontrado = false;
$error = null;

foreach ($cola["paquetes"] as &$paquete) {
    if (intval($paquete["id"]) !== $id) {
        continue;
    }
    $encontrado = true;

    // Solo aceptamos el resultado del esclavo al que se asignó el paquete
    if ($paquete["esclavo"] !== $esclavo) {
        $error = "Este paquete pertenece a otro esclavo";
    } elseif ($paquete["estado"] === "terminado") {
        $error = "El paquete ya estaba terminado";
    } else {
        $paquete["estado"] = "terminado";
        $paquete["resultado"] = $resultado;
        $paquete["segundos"] = $segundos;
        $paquete["terminado_en"] = time();
        $paquete["datos"] = [];    // ya no hacen falta
    }
    break;
}
unset($paquete);

if ($encontrado && $error === null) {
    escribir_cola($f, $cola);
}

flock($f, LOCK_UN);
fclose($f);

if (!$encontrado) {
    responder(["ok" => false, "error" => "Paquete inexistente"]);
}
if ($error !== null) {
    responder(["ok" => false, "error" => $error]);
}
responder(["ok" => true, "id" => $id]);
?>
