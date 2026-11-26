<?php
// Inicio y cierre de sesión
//   GET  002-sesion.php?accion=yo       quién soy (o 401 si no hay sesión)
//   POST 002-sesion.php?accion=login    {email, password}
//   POST 002-sesion.php?accion=logout

require_once '001-comun.php';

$accion = $_GET['accion'] ?? 'yo';

if ($accion === 'yo') {
    $usuario = usuario_actual();
    if ($usuario === null) {
        fallar('No hay sesión iniciada', 401);
    }
    $config = configuracion();
    responder(['ok' => true, 'usuario' => $usuario, 'hotel' => $config['hotel'] ?? '', 'hoy' => date('Y-m-d')]);
}

if ($accion === 'login') {
    exigir_post();
    $datos = entrada();
    $email = strtolower(trim((string)($datos['email'] ?? '')));
    $password = (string)($datos['password'] ?? '');
    if ($email === '' || $password === '' || strlen($email) > 120 || strlen($password) > 200) {
        fallar('Escribe tu email y tu contraseña');
    }

    $db = abrir_bd();

    // Demasiados intentos fallidos recientes: bloqueo temporal
    $desde = time() - MINUTOS_BLOQUEO * 60;
    $fallos = consultar_uno($db, 'SELECT COUNT(*) AS n FROM intentos_login WHERE email = ? AND momento > ?', [$email, $desde]);
    if ($fallos['n'] >= MAX_INTENTOS) {
        auditar($db, 'login bloqueado', $email);
        fallar('Demasiados intentos. Espera ' . MINUTOS_BLOQUEO . ' minutos', 429);
    }

    $usuario = consultar_uno($db, 'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ? AND activo = 1', [$email]);

    // Si el usuario no existe, se comprueba igualmente contra un hash falso:
    // así tarda lo mismo y no se puede averiguar qué emails existen
    $hash = $usuario['password_hash'] ?? '$2y$10$lSvuMuIvYnCwc6.5CEQe4ukfkd7HhBA2BlFHOZLpaY/s.kmmzMFGe';
    if (!password_verify($password, $hash) || $usuario === null) {
        ejecutar($db, 'INSERT INTO intentos_login (email, momento) VALUES (?, ?)', [$email, time()]);
        auditar($db, 'login fallido', $email);
        fallar('Credenciales incorrectas', 401);
    }

    // Acceso correcto: aquí sí se crea la sesión
    iniciar_sesion();
    ejecutar($db, 'DELETE FROM intentos_login WHERE email = ?', [$email]);
    session_regenerate_id(true);     // nueva sesión: evita que alguien reutilice una anterior
    $_SESSION['usuario'] = ['id' => (int)$usuario['id'], 'nombre' => $usuario['nombre'],
        'email' => $usuario['email'], 'rol' => $usuario['rol']];
    auditar($db, 'login', $usuario['rol']);
    responder(['ok' => true, 'usuario' => $_SESSION['usuario']]);
}

if ($accion === 'logout') {
    exigir_post();
    if (usuario_actual() !== null) {
        auditar(abrir_bd(), 'logout');
    }
    iniciar_sesion();
    $_SESSION = [];
    session_destroy();
    responder(['ok' => true]);
}

fallar('Acción no válida', 404);
