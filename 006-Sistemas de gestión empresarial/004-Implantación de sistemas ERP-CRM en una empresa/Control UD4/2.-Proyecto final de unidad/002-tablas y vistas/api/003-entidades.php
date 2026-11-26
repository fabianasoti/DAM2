<?php
// Entidades que se pueden gestionar con la tabla y el formulario genéricos.
// Aquí se decide qué campos tiene cada una y qué rol puede leer, escribir o borrar.
// Cada campo: [clave, tipo, etiqueta, requerido, extra]
//   tipos: texto, email, numero, fecha, select, fk, password

return [
    'clientes' => [
        'etiqueta' => 'Clientes',
        'orden' => 'apellidos, nombre',
        'leer' => ['admin', 'recepcion'],
        'escribir' => ['admin', 'recepcion'],
        'borrar' => ['admin'],
        'campos' => [
            ['nombre', 'texto', 'Nombre', true, []],
            ['apellidos', 'texto', 'Apellidos', true, []],
            ['dni_pasaporte', 'texto', 'Documento', true, []],
            ['telefono', 'texto', 'Teléfono', false, []],
            ['email', 'email', 'Email', false, []],
            ['pais', 'texto', 'País', true, []],
            ['idioma', 'select', 'Idioma', true, ['opciones' => ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués'], 'defecto' => 'Español']],
            ['observaciones', 'texto', 'Observaciones', false, []],
        ],
    ],
    'habitaciones' => [
        'etiqueta' => 'Habitaciones',
        'orden' => 'numero',
        'leer' => ['admin', 'recepcion'],
        'escribir' => ['admin'],
        'borrar' => ['admin'],
        'campos' => [
            ['numero', 'texto', 'Número', true, []],
            ['planta', 'numero', 'Planta', true, ['min' => 0, 'max' => 20, 'entero' => true]],
            ['tipo', 'select', 'Tipo', true, ['opciones' => ['Individual', 'Doble', 'Suite']]],
            ['capacidad', 'numero', 'Capacidad', true, ['min' => 1, 'max' => 6, 'entero' => true]],
            ['precio_noche', 'numero', 'Precio por noche (€)', true, ['min' => 1, 'max' => 5000]],
            // El estado lo cambian los flujos de recepción y limpieza, no se edita a mano
            ['estado', 'select', 'Estado', false, ['opciones' => ['disponible', 'ocupada', 'sucia', 'mantenimiento'], 'solo_lectura' => true]],
        ],
    ],
    'temporadas' => [
        'etiqueta' => 'Temporadas',
        'orden' => 'fecha_inicio',
        'leer' => ['admin', 'recepcion'],
        'escribir' => ['admin'],
        'borrar' => ['admin'],
        'campos' => [
            ['nombre', 'texto', 'Nombre', true, []],
            ['fecha_inicio', 'fecha', 'Desde', true, []],
            ['fecha_fin', 'fecha', 'Hasta', true, []],
            ['multiplicador', 'numero', 'Multiplicador del precio', true, ['min' => 0.1, 'max' => 5]],
        ],
    ],
    'usuarios' => [
        'etiqueta' => 'Usuarios',
        'orden' => 'nombre',
        'leer' => ['admin'],
        'escribir' => ['admin'],
        'borrar' => ['admin'],
        'campos' => [
            ['nombre', 'texto', 'Nombre', true, []],
            ['email', 'email', 'Email', true, []],
            ['rol', 'select', 'Rol', true, ['opciones' => ['admin', 'recepcion', 'mantenimiento', 'limpieza']]],
            ['activo', 'select', 'Activo', true, ['opciones' => ['1', '0']]],
            // No es una columna: se convierte en password_hash al guardar
            ['password', 'password', 'Contraseña (mínimo 8 caracteres)', false, []],
        ],
    ],
    'auditoria' => [
        'etiqueta' => 'Auditoría',
        'orden' => 'id DESC',
        'leer' => ['admin'],
        'escribir' => [],
        'borrar' => [],
        'campos' => [
            ['fecha', 'texto', 'Fecha', false, ['solo_lectura' => true]],
            ['usuario_id', 'fk', 'Usuario', false, ['tabla' => 'usuarios', 'texto' => 'nombre', 'solo_lectura' => true]],
            ['accion', 'texto', 'Acción', false, ['solo_lectura' => true]],
            ['detalle', 'texto', 'Detalle', false, ['solo_lectura' => true]],
        ],
    ],
];
