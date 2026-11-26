<?php
// Instalador: crea data/003-thistle.db con el esquema y datos de ejemplo inventados.
// Las fechas de las reservas se calculan respecto al día de hoy, así siempre hay
// llegadas, salidas y huéspedes en casa para probar.
//
// Uso por consola:  php servicios/001-instalar.php           (crea la base si no existe)
//                   php servicios/001-instalar.php --forzar  (la borra y la vuelve a crear)
// También se ejecuta solo la primera vez que alguien usa la aplicación.

const CONTRASENA_DEMO = 'Thistle2026!';

function instalar_base($forzar = false) {
    $ruta = dirname(__DIR__) . '/data/003-thistle.db';
    if (file_exists($ruta)) {
        if (!$forzar) {
            return false;    // ya está instalada
        }
        unlink($ruta);
    }

    mt_srand(2026);    // misma semilla: siempre salen los mismos datos
    date_default_timezone_set('Europe/Madrid');

    try {
        return crear_datos($ruta);
    } catch (Throwable $error) {
        if (file_exists($ruta)) { unlink($ruta); }    // no dejamos una base a medias
        throw $error;
    }
}

function crear_datos($ruta) {
    $db = new SQLite3($ruta);
    $db->enableExceptions(true);
    $db->exec(file_get_contents(dirname(__DIR__) . '/data/001-schema.sql'));
    $db->exec('BEGIN');

    $hoy = date('Y-m-d');

    // ---------- Personal ----------
    $personal = [
        ['Lucía Ferrer', 'lucia.ferrer@cardomarino.example', 'admin'],
        ['Sergio Molina', 'sergio.molina@cardomarino.example', 'recepcion'],
        ['Irene Campos', 'irene.campos@cardomarino.example', 'recepcion'],
        ['Pablo Navarro', 'pablo.navarro@cardomarino.example', 'mantenimiento'],
        ['Rosa Delgado', 'rosa.delgado@cardomarino.example', 'limpieza'],
        ['Nuria Vidal', 'nuria.vidal@cardomarino.example', 'limpieza'],
    ];
    $hash = password_hash(CONTRASENA_DEMO, PASSWORD_DEFAULT);
    $st = $db->prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)');
    foreach ($personal as $p) {
        $st->bindValue(1, $p[0]); $st->bindValue(2, $p[1]); $st->bindValue(3, $hash); $st->bindValue(4, $p[2]);
        $st->execute(); $st->reset();
    }

    // ---------- Temporadas (año pasado, actual y siguiente) ----------
    $anio = (int)date('Y');
    $st = $db->prepare('INSERT INTO temporadas (nombre, fecha_inicio, fecha_fin, multiplicador) VALUES (?, ?, ?, ?)');
    $temporadas = [];
    for ($a = $anio - 1; $a <= $anio + 1; $a++) {
        $tramos = [
            ['Navidad', "$a-01-01", "$a-01-06", 1.25],
            ['Baja invierno', "$a-01-07", "$a-03-31", 0.85],
            ['Media primavera', "$a-04-01", "$a-06-30", 1.00],
            ['Alta verano', "$a-07-01", "$a-08-31", 1.35],
            ['Media otoño', "$a-09-01", "$a-10-31", 1.05],
            ['Baja noviembre', "$a-11-01", "$a-12-22", 0.85],
            ['Navidad', "$a-12-23", "$a-12-31", 1.25],
        ];
        foreach ($tramos as $t) {
            $st->bindValue(1, $t[0]); $st->bindValue(2, $t[1]); $st->bindValue(3, $t[2]); $st->bindValue(4, $t[3]);
            $st->execute(); $st->reset();
            $temporadas[] = $t;
        }
    }

    // ---------- Habitaciones: 5 plantas de 10 ----------
    $distribucion = [   // por planta: individuales y dobles (el resto son suites)
        1 => [6, 4], 2 => [6, 4], 3 => [4, 6], 4 => [0, 10], 5 => [0, 2],
    ];
    $habitaciones = [];   // id => [precio, capacidad, tipo]
    $st = $db->prepare('INSERT INTO habitaciones (numero, planta, tipo, capacidad, precio_noche) VALUES (?, ?, ?, ?, ?)');
    foreach ($distribucion as $planta => $d) {
        for ($i = 1; $i <= 10; $i++) {
            if ($i <= $d[0]) { $tipo = 'Individual'; $cap = 1; $precio = 65 + ($i % 4) * 5; }
            elseif ($i <= $d[0] + $d[1]) { $tipo = 'Doble'; $cap = 2 + ($i % 2); $precio = 95 + ($i % 4) * 5; }
            else { $tipo = 'Suite'; $cap = 4; $precio = 165 + ($i % 4) * 10; }
            $numero = $planta . str_pad($i, 2, '0', STR_PAD_LEFT);
            $st->bindValue(1, $numero); $st->bindValue(2, $planta); $st->bindValue(3, $tipo);
            $st->bindValue(4, $cap); $st->bindValue(5, $precio);
            $st->execute(); $st->reset();
            $habitaciones[$db->lastInsertRowID()] = [$precio, $cap, $tipo];
        }
    }

    // ---------- Clientes inventados ----------
    // Documentos con prefijo ZZ y correos en example.com (dominio reservado): no son datos reales
    $nombres = ['Alba', 'Daniel', 'Marta', 'Hugo', 'Laura', 'Adrián', 'Sofía', 'Iván', 'Elena', 'Marcos',
        'Carla', 'Álvaro', 'Paula', 'Rubén', 'Nerea', 'Gonzalo', 'Claudia', 'Víctor', 'Noelia', 'Samuel',
        'Julia', 'Óscar', 'Lidia', 'Raúl', 'Inés', 'Tomás', 'Aitana', 'Mario', 'Beatriz', 'Jorge'];
    $apellidos = ['García', 'Martín', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno',
        'Álvarez', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil',
        'Serrano', 'Blanco', 'Suárez', 'Molina', 'Castro', 'Ortega', 'Rubio', 'Marín', 'Sanz', 'Iglesias'];
    $paises = ['España', 'España', 'España', 'España', 'España', 'España', 'Francia', 'Francia', 'Alemania',
        'Alemania', 'Reino Unido', 'Reino Unido', 'Italia', 'Países Bajos', 'Portugal', 'Estados Unidos'];
    $numClientes = 400;
    $st = $db->prepare('INSERT INTO clientes (nombre, apellidos, dni_pasaporte, telefono, email, pais) VALUES (?, ?, ?, ?, ?, ?)');
    for ($i = 1; $i <= $numClientes; $i++) {
        $n = $nombres[mt_rand(0, count($nombres) - 1)];
        $a1 = $apellidos[mt_rand(0, count($apellidos) - 1)];
        $a2 = $apellidos[mt_rand(0, count($apellidos) - 1)];
        $sin_tildes = ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
            'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ñ' => 'N'];
        $correo = strtolower(strtr($n . '.' . $a1, $sin_tildes)) . $i . '@example.com';
        $st->bindValue(1, $n); $st->bindValue(2, "$a1 $a2");
        $st->bindValue(3, 'ZZ' . str_pad($i, 7, '0', STR_PAD_LEFT));
        $st->bindValue(4, '+34 600 000 ' . str_pad($i % 1000, 3, '0', STR_PAD_LEFT));
        $st->bindValue(5, $correo); $st->bindValue(6, $paises[mt_rand(0, count($paises) - 1)]);
        $st->execute(); $st->reset();
    }

    // ---------- Reservas: desde hace un año hasta dentro de 3 meses ----------
    $multiplicador = function ($fecha) use ($temporadas) {
        foreach ($temporadas as $t) {
            if ($fecha >= $t[1] && $fecha <= $t[2]) { return $t[3]; }
        }
        return 1.0;
    };
    // Suma (o resta, si es negativo) días a una fecha
    $suma_dias = fn($f, $n) => (new DateTime($f))->modify("$n day")->format('Y-m-d');

    $inicio = $suma_dias($hoy, -365);
    $limite = $suma_dias($hoy, 90);
    $canales = ['directo', 'directo', 'directo', 'web', 'web', 'web', 'web', 'agencia', 'agencia', 'telefono'];
    $st = $db->prepare('INSERT INTO reservas (habitacion_id, cliente_id, fecha_entrada, fecha_salida, num_huespedes, canal, estado, importe_total, fecha_creacion)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $ocupadas_hoy = [];
    $salidas_recientes = [];     // habitaciones con check-out en los últimos 2 días
    // Dos habitaciones en mantenimiento: no tienen estancias alrededor de hoy
    $bloqueadas = array_flip(array_slice(array_keys($habitaciones), 10, 2));
    $total_reservas = 0;

    foreach ($habitaciones as $id => $h) {
        $cursor = $suma_dias($inicio, mt_rand(0, 4));
        while ($cursor < $limite) {
            $m = $multiplicador($cursor);
            // Más huecos entre estancias en temporada baja, menos en alta
            $hueco = ($m < 1) ? mt_rand(0, 4) : (($m > 1.2) ? mt_rand(0, 1) : mt_rand(0, 2));
            $entrada = $suma_dias($cursor, $hueco);
            $noches = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6, 7][mt_rand(0, 12)];
            $salida = $suma_dias($entrada, $noches);
            $cursor = $salida;
            if ($entrada >= $limite) { break; }
            if (isset($bloqueadas[$id]) && $entrada <= $suma_dias($hoy, 4) && $salida >= $suma_dias($hoy, -1)) { continue; }

            // Estado según el día de hoy
            if ($salida < $hoy) { $estado = 'check-out'; }
            elseif ($entrada <= $hoy && $hoy <= $salida && $entrada < $hoy) { $estado = 'check-in'; }
            elseif ($entrada == $hoy) { $estado = 'confirmada'; }
            else { $estado = 'confirmada'; }
            // Algunas reservas se cancelaron (no ocupan habitación)
            if (($estado == 'check-out' && mt_rand(1, 100) <= 7) || ($estado == 'confirmada' && $entrada > $hoy && mt_rand(1, 100) <= 9)) {
                $estado = 'cancelada';
            }
            if ($estado == 'check-in') { $ocupadas_hoy[$id] = true; }
            if ($estado == 'check-out' && $salida >= $suma_dias($hoy, -2)) { $salidas_recientes[$id] = $salida; }

            // Importe: suma de cada noche con el multiplicador de su temporada
            $importe = 0;
            for ($n = 0; $n < $noches; $n++) {
                $importe += round($h[0] * $multiplicador($suma_dias($entrada, $n)), 2);
            }
            $huespedes = ($h[2] == 'Individual') ? 1 : mt_rand(1, $h[1]);
            $anticipacion = mt_rand(1, 60);
            $st->bindValue(1, $id); $st->bindValue(2, mt_rand(1, $numClientes));
            $st->bindValue(3, $entrada); $st->bindValue(4, $salida); $st->bindValue(5, $huespedes);
            $st->bindValue(6, $canales[mt_rand(0, 9)]); $st->bindValue(7, $estado);
            $st->bindValue(8, round($importe, 2));
            $st->bindValue(9, $suma_dias($entrada, -$anticipacion) . ' ' . str_pad(mt_rand(8, 21), 2, '0', STR_PAD_LEFT) . ':' . str_pad(mt_rand(0, 59), 2, '0', STR_PAD_LEFT) . ':00');
            $st->execute(); $st->reset();
            $total_reservas++;
        }
    }

    // ---------- Estado actual de las habitaciones ----------
    foreach (array_keys($ocupadas_hoy) as $id) {
        $db->exec("UPDATE habitaciones SET estado = 'ocupada' WHERE id = $id");
    }
    // Algunas habitaciones recién desocupadas están sucias, con su parte de limpieza pendiente
    $sucias = 0;
    foreach ($salidas_recientes as $id => $salida) {
        if ($sucias >= 5 || isset($ocupadas_hoy[$id])) { continue; }
        $db->exec("UPDATE habitaciones SET estado = 'sucia' WHERE id = $id");
        $db->exec("INSERT INTO mantenimiento (habitacion_id, tipo, descripcion, prioridad, fecha_creacion)
                   VALUES ($id, 'limpieza', 'Limpieza completa tras la salida', 'media', '$salida 12:00:00')");
        $sucias++;
    }
    // Averías abiertas: las dos primeras bloquean su habitación, las demás no
    $ids = array_keys($habitaciones);
    $tareas = [
        [$ids[10], 'El aire acondicionado no enfría', 'urgente', true],
        [$ids[11], 'Fuga de agua en el baño', 'alta', true],
        [$ids[20], 'Bombilla fundida en el pasillo', 'baja', false],
        [$ids[21], 'La puerta del balcón roza', 'media', false],
        [$ids[22], 'Televisión sin señal', 'media', false],
    ];
    foreach ($tareas as $t) {
        $db->exec("INSERT INTO mantenimiento (habitacion_id, tipo, descripcion, prioridad, fecha_creacion)
                   VALUES ($t[0], 'averia', '$t[1]', '$t[2]', '" . $suma_dias($hoy, -1) . " 09:00:00')");
        if ($t[3]) { $db->exec("UPDATE habitaciones SET estado = 'mantenimiento' WHERE id = $t[0]"); }
    }
    // Historial de averías y limpiezas ya resueltas durante el último año
    $descripciones = ['Cambio de bombilla', 'Revisión del aire acondicionado', 'Reparación de cisterna',
        'Cerradura de la puerta', 'Persiana atascada', 'Mando de televisión', 'Grifo que gotea'];
    for ($i = 0; $i < 30; $i++) {
        $id = array_keys($habitaciones)[mt_rand(0, 49)];
        $creado = $suma_dias($hoy, -mt_rand(3, 360));
        $db->exec("INSERT INTO mantenimiento (habitacion_id, usuario_id, tipo, descripcion, prioridad, estado, fecha_creacion, fecha_resolucion)
                   VALUES ($id, 4, 'averia', '" . $descripciones[mt_rand(0, 6)] . "', '" . ['baja', 'media', 'alta'][mt_rand(0, 2)] . "', 'resuelto', '$creado 10:00:00', '" . $suma_dias($creado, mt_rand(0, 2)) . " 16:00:00')");
    }

    $db->exec('COMMIT');
    $resumen = [
        'reservas' => $total_reservas,
        'ocupadas_hoy' => count($ocupadas_hoy),
        'sucias' => $sucias,
        'en_mantenimiento' => 2,
    ];
    $db->close();
    return $resumen;
}

// Si se ejecuta por consola (php servicios/001-instalar.php)
if (PHP_SAPI === 'cli' && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    $inicio = microtime(true);
    $resultado = instalar_base(in_array('--forzar', $argv));
    if ($resultado === false) {
        echo "La base de datos ya existe. Usa --forzar para crearla de nuevo.\n";
    } else {
        echo 'Base de datos creada en ' . round(microtime(true) - $inicio, 2) . " s\n";
        echo $resultado['reservas'] . ' reservas, ' . $resultado['ocupadas_hoy'] . ' habitaciones ocupadas hoy, ' . $resultado['sucias'] . " sucias\n";
        echo 'Contraseña de todos los usuarios de ejemplo: ' . CONTRASENA_DEMO . "\n";
    }
}
