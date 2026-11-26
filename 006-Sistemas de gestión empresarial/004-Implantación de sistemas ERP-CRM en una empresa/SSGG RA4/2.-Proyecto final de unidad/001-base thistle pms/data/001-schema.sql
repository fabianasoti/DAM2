-- =========================================================
-- Thistle PMS · esquema de la base de datos (SQLite)
-- Gestión hotelera: reservas, habitaciones, clientes, mantenimiento
-- =========================================================
PRAGMA foreign_keys = ON;

-- Personal del hotel. La contraseña se guarda siempre cifrada (password_hash)
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'recepcion', 'mantenimiento', 'limpieza')),
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

CREATE TABLE habitaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    planta INTEGER NOT NULL CHECK (planta BETWEEN 0 AND 20),
    tipo TEXT NOT NULL CHECK (tipo IN ('Individual', 'Doble', 'Suite')),
    capacidad INTEGER NOT NULL CHECK (capacidad BETWEEN 1 AND 6),
    precio_noche REAL NOT NULL CHECK (precio_noche > 0),
    estado TEXT NOT NULL DEFAULT 'disponible'
        CHECK (estado IN ('disponible', 'ocupada', 'sucia', 'mantenimiento'))
);

CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    dni_pasaporte TEXT NOT NULL UNIQUE,
    telefono TEXT,
    email TEXT,
    pais TEXT NOT NULL DEFAULT 'España'
);

-- Temporadas: multiplican el precio de la noche (baja 0,85, alta 1,35...)
CREATE TABLE temporadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT NOT NULL,
    multiplicador REAL NOT NULL CHECK (multiplicador > 0),
    CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitacion_id INTEGER NOT NULL REFERENCES habitaciones (id),
    cliente_id INTEGER NOT NULL REFERENCES clientes (id),
    fecha_entrada TEXT NOT NULL,
    fecha_salida TEXT NOT NULL,
    num_huespedes INTEGER NOT NULL DEFAULT 1 CHECK (num_huespedes >= 1),
    canal TEXT NOT NULL DEFAULT 'directo' CHECK (canal IN ('directo', 'web', 'agencia', 'telefono')),
    estado TEXT NOT NULL DEFAULT 'confirmada'
        CHECK (estado IN ('confirmada', 'check-in', 'check-out', 'cancelada')),
    importe_total REAL NOT NULL DEFAULT 0 CHECK (importe_total >= 0),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (fecha_salida > fecha_entrada)
);

-- Partes de trabajo: averías (mantenimiento) y limpiezas de habitación
CREATE TABLE mantenimiento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitacion_id INTEGER NOT NULL REFERENCES habitaciones (id),
    usuario_id INTEGER REFERENCES usuarios (id),
    tipo TEXT NOT NULL DEFAULT 'averia' CHECK (tipo IN ('averia', 'limpieza')),
    descripcion TEXT NOT NULL,
    prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TEXT
);

-- Registro de acciones importantes (quién hizo qué y cuándo)
CREATE TABLE auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER REFERENCES usuarios (id),
    accion TEXT NOT NULL,
    detalle TEXT,
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Intentos fallidos de inicio de sesión (para bloquear fuerza bruta)
CREATE TABLE intentos_login (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    momento INTEGER NOT NULL
);

CREATE INDEX idx_reservas_habitacion ON reservas (habitacion_id, fecha_entrada, fecha_salida);
CREATE INDEX idx_reservas_estado ON reservas (estado);
CREATE INDEX idx_reservas_entrada ON reservas (fecha_entrada);
CREATE INDEX idx_mantenimiento_estado ON mantenimiento (tipo, estado);
CREATE INDEX idx_intentos_email ON intentos_login (email, momento);

-- Última defensa: la base de datos NO deja guardar dos reservas activas
-- de la misma habitación que se pisen en fechas (aunque falle la validación de PHP)
CREATE TRIGGER reservas_sin_solape_insertar
BEFORE INSERT ON reservas
WHEN NEW.estado <> 'cancelada'
 AND EXISTS (
    SELECT 1 FROM reservas r
    WHERE r.habitacion_id = NEW.habitacion_id
      AND r.estado <> 'cancelada'
      AND r.fecha_entrada < NEW.fecha_salida
      AND NEW.fecha_entrada < r.fecha_salida
 )
BEGIN
    SELECT RAISE(ABORT, 'La habitación ya está reservada en esas fechas');
END;

CREATE TRIGGER reservas_sin_solape_actualizar
BEFORE UPDATE OF habitacion_id, fecha_entrada, fecha_salida, estado ON reservas
WHEN NEW.estado <> 'cancelada'
 AND EXISTS (
    SELECT 1 FROM reservas r
    WHERE r.id <> NEW.id
      AND r.habitacion_id = NEW.habitacion_id
      AND r.estado <> 'cancelada'
      AND r.fecha_entrada < NEW.fecha_salida
      AND NEW.fecha_entrada < r.fecha_salida
 )
BEGIN
    SELECT RAISE(ABORT, 'La habitación ya está reservada en esas fechas');
END;
