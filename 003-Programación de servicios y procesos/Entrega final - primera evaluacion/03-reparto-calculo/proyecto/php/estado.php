<?php
// El maestro consulta cómo va el trabajo: recuentos, resultado sumado y comprobación

require_once "comun.php";

$f = abrir_cola();
flock($f, LOCK_SH);    // solo leemos: varios pueden leer a la vez
$cola = leer_cola($f);
flock($f, LOCK_UN);
fclose($f);

$pendientes = 0;
$asignados = 0;
$terminados = 0;
$tablero = [];        // una letra por paquete: p, a o t
$enMarcha = [];       // qué paquete tiene cada esclavo ahora y desde hace cuánto
$porEsclavo = [];     // paquetes terminados por cada esclavo
$ingresos = [];       // suma de los ingresos de cada tienda (céntimos)
$unidades = [];       // suma de unidades de cada producto
$importeTotal = 0;
$ultimoFin = 0;

foreach ($cola["paquetes"] as $paquete) {
    if ($paquete["estado"] === "pendiente") {
        $pendientes++;
        $tablero[] = "p";
    } elseif ($paquete["estado"] === "asignado") {
        $asignados++;
        $tablero[] = "a";
        $enMarcha[] = [
            "id" => $paquete["id"],
            "esclavo" => $paquete["esclavo"],
            "segundos" => time() - $paquete["asignado_en"]
        ];
    } else {
        $terminados++;
        $tablero[] = "t";

        $nombre = $paquete["esclavo"];
        $porEsclavo[$nombre] = ($porEsclavo[$nombre] ?? 0) + 1;
        $ultimoFin = max($ultimoFin, $paquete["terminado_en"]);

        foreach ($paquete["resultado"]["ingresos"] as $tienda => $cantidad) {
            $ingresos[$tienda] = ($ingresos[$tienda] ?? 0) + intval($cantidad);
        }
        foreach ($paquete["resultado"]["unidades"] as $producto => $cantidad) {
            $unidades[$producto] = ($unidades[$producto] ?? 0) + intval($cantidad);
        }
        $importeTotal += intval($paquete["resultado"]["importe_total"]);
    }
}

$total = count($cola["paquetes"]);
$hecho = $total > 0 && $terminados === $total;

// Segundos desde que se preparó el trabajo (si ya ha terminado, hasta el último paquete)
$segundos = 0;
if ($total > 0) {
    $fin = $hecho ? $ultimoFin : time();
    $segundos = $fin - $cola["inicio"];
}

responder([
    "total" => $total,
    "pendientes" => $pendientes,
    "asignados" => $asignados,
    "terminados" => $terminados,
    "tablero" => $tablero,
    "en_marcha" => $enMarcha,
    "preparado" => $cola["inicio"],
    "tiempo_maximo" => TIEMPO_MAXIMO,
    "por_esclavo" => $porEsclavo,
    "ingresos" => $ingresos,
    "unidades" => $unidades,
    "importe_total" => $importeTotal,
    "esperado" => $cola["esperado"],
    // Solo se puede comprobar cuando todos han terminado
    "coincide" => $hecho ? ($importeTotal === $cola["esperado"]["importe"]) : null,
    "segundos" => $segundos
]);
?>
