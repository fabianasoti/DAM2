<?php
// El maestro vacía la cola para empezar de nuevo

require_once "comun.php";

$f = abrir_cola();
flock($f, LOCK_EX);
escribir_cola($f, ["inicio" => 0, "esperado" => null, "paquetes" => []]);
flock($f, LOCK_UN);
fclose($f);

responder(["ok" => true, "mensaje" => "Cola reiniciada"]);
?>
