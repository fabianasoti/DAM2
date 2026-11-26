<?php
// Funciones comunes de la API: base de datos, sesión, permisos y respuestas

date_default_timezone_set('Europe/Madrid');
define('RAIZ', dirname(__DIR__));
define('RUTA_BD', RAIZ . '/data/003-thistle.db');

const MAX_INTENTOS = 5;        // intentos de login fallidos permitidos...
const MINUTOS_BLOQUEO = 10;    // ...en estos minutos

// ---------- Respuestas ----------
function responder($datos, $codigo = 200) {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function fallar($mensaje, $codigo = 400) {
    responder(['ok' => false, 'error' => $mensaje], $codigo);
}

// Lee el JSON recibido. Las peticiones que cambian datos deben ser JSON:
// un formulario de otra web no puede enviar JSON sin permiso, así evitamos ataques CSRF
function entrada() {
    $tipo = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($tipo, 'application/json') !== 0) {
        fallar('Tipo de contenido no permitido', 415);
    }
    $datos = json_decode(file_get_contents('php://input'), true);
    return is_array($datos) ? $datos : [];
}

function exigir_post() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        fallar('Se esperaba una petición POST', 405);
    }
}

// ---------- Sesión ----------
function iniciar_sesion() {
    if (session_status() === PHP_SESSION_NONE) {
        session_name('thistle');
        // HttpOnly: JavaScript no puede leer la cookie. SameSite: no se envía desde otras webs
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'path' => '/']);
        session_start();
    }
}

function usuario_actual() {
    // Sin cookie de sesión no hay nadie conectado: no se crea ninguna sesión para visitas anónimas
    if (!isset($_COOKIE['thistle']) && session_status() === PHP_SESSION_NONE) {
        return null;
    }
    iniciar_sesion();
    return $_SESSION['usuario'] ?? null;
}

// Devuelve el usuario si ha iniciado sesión y su rol está permitido; si no, corta con error
function exigir_rol($roles) {
    $usuario = usuario_actual();
    if ($usuario === null) {
        fallar('Debes iniciar sesión', 401);
    }
    if (!in_array($usuario['rol'], $roles)) {
        fallar('Tu rol no tiene permiso para esta acción', 403);
    }
    return $usuario;
}

// ---------- Base de datos ----------
function abrir_bd() {
    if (!file_exists(RUTA_BD)) {
        // Primera vez: se crea la base de datos con los datos de ejemplo
        require_once RAIZ . '/servicios/001-instalar.php';
        try {
            instalar_base();
        } catch (Throwable $error) {
            fallar('No se pudo crear la base de datos. Comprueba que PHP tiene SQLite y permiso de escritura en data/', 500);
        }
    }
    $db = new SQLite3(RUTA_BD);
    $db->enableExceptions(true);
    $db->busyTimeout(5000);          // si otra petición escribe, espera hasta 5 s
    $db->exec('PRAGMA foreign_keys = ON');
    return $db;
}

// Empieza una transacción que reserva la base de datos para escribir.
// Si otra petición la tiene bloqueada demasiado tiempo, se avisa en vez de fallar sin explicación
function empezar_transaccion($db) {
    try {
        $db->exec('BEGIN IMMEDIATE');
    } catch (Exception $error) {
        fallar('La base de datos está ocupada, inténtalo de nuevo en unos segundos', 503);
    }
}

// Consulta con parámetros (consulta preparada: los valores nunca se mezclan con el SQL)
function consultar($db, $sql, $parametros = []) {
    $consulta = preparar($db, $sql, $parametros);
    $resultado = $consulta->execute();
    $filas = [];
    while ($fila = $resultado->fetchArray(SQLITE3_ASSOC)) {
        $filas[] = $fila;
    }
    return $filas;
}

// Devuelve solo la primera fila (o null)
function consultar_uno($db, $sql, $parametros = []) {
    $filas = consultar($db, $sql, $parametros);
    return $filas[0] ?? null;
}

// Ejecuta INSERT, UPDATE o DELETE. Devuelve las filas afectadas
function ejecutar($db, $sql, $parametros = []) {
    preparar($db, $sql, $parametros)->execute();
    return $db->changes();
}

function preparar($db, $sql, $parametros) {
    $consulta = $db->prepare($sql);
    foreach (array_values($parametros) as $i => $valor) {
        if (is_int($valor)) { $tipo = SQLITE3_INTEGER; }
        elseif (is_float($valor)) { $tipo = SQLITE3_FLOAT; }
        elseif ($valor === null) { $tipo = SQLITE3_NULL; }
        else { $tipo = SQLITE3_TEXT; }
        $consulta->bindValue($i + 1, $valor, $tipo);
    }
    return $consulta;
}

// Traduce los errores de SQLite a mensajes que entienda quien usa la aplicación
function mensaje_error($error) {
    $texto = $error->getMessage();
    if (strpos($texto, 'La habitación ya está reservada') !== false) {
        return 'La habitación ya está reservada en esas fechas';
    }
    if (strpos($texto, 'UNIQUE constraint failed') !== false) {
        return 'Ya existe un registro con ese valor (' . substr(strrchr($texto, '.'), 1) . ')';
    }
    if (strpos($texto, 'FOREIGN KEY constraint failed') !== false) {
        return 'No se puede completar: hay datos relacionados (por ejemplo, reservas)';
    }
    if (strpos($texto, 'CHECK constraint failed') !== false) {
        return 'Algún valor no es válido para este campo';
    }
    if (strpos($texto, 'database is locked') !== false) {
        return 'La base de datos está ocupada, inténtalo de nuevo';
    }
    return 'Error al guardar los datos';
}

// ---------- Auditoría ----------
function auditar($db, $accion, $detalle = '') {
    $usuario = $_SESSION['usuario'] ?? null;
    ejecutar($db, 'INSERT INTO auditoria (usuario_id, accion, detalle) VALUES (?, ?, ?)',
        [$usuario['id'] ?? null, $accion, $detalle]);
}

// ---------- Fechas ----------
function es_fecha($texto) {
    if (!is_string($texto)) { return false; }
    $fecha = DateTime::createFromFormat('Y-m-d', $texto);
    return $fecha !== false && $fecha->format('Y-m-d') === $texto;
}

function sumar_dias($fecha, $dias) {
    return (new DateTime($fecha))->modify("$dias day")->format('Y-m-d');
}

function contar_noches($entrada, $salida) {
    return (int)(new DateTime($entrada))->diff(new DateTime($salida))->days;
}

// ---------- Precio de una estancia ----------
// Cada noche cuesta: precio de la habitación x multiplicador de su temporada
function calcular_importe($db, $habitacion_id, $entrada, $salida) {
    $habitacion = consultar_uno($db, 'SELECT precio_noche FROM habitaciones WHERE id = ?', [(int)$habitacion_id]);
    if ($habitacion === null) { return null; }
    $temporadas = consultar($db, 'SELECT fecha_inicio, fecha_fin, multiplicador FROM temporadas
                                  WHERE fecha_fin >= ? AND fecha_inicio < ? ORDER BY id', [$entrada, $salida]);
    $total = 0;
    for ($dia = $entrada; $dia < $salida; $dia = sumar_dias($dia, 1)) {
        $multiplicador = 1.0;
        foreach ($temporadas as $t) {
            if ($dia >= $t['fecha_inicio'] && $dia <= $t['fecha_fin']) { $multiplicador = (float)$t['multiplicador']; }
        }
        $total += round($habitacion['precio_noche'] * $multiplicador, 2);
    }
    return round($total, 2);
}

// ---------- Configuración del hotel ----------
function configuracion() {
    $config = json_decode(file_get_contents(RAIZ . '/data/002-config.json'), true);
    return is_array($config) ? $config : [];
}
