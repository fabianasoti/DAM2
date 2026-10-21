-- ==========================================
-- SCRIPT COMPLETO DE ESQUEMA DE BASE DE DATOS (schema.sql)
-- Sistema PMS + GMAO para Gestión Hotelera
-- ==========================================

-- 1. Tabla de Usuarios y Empleados (Personal del hotel y administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('admin', 'recepcion', 'mantenimiento', 'limpieza'))
);

-- 2. Tabla de Habitaciones (PMS)
CREATE TABLE IF NOT EXISTS habitaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL, -- Individual, Doble, Suite, etc.
    precio_noche REAL NOT NULL,
    estado TEXT NOT NULL DEFAULT 'disponible' CHECK(estado IN ('disponible', 'ocupada', 'sucia', 'mantenimiento'))
);

-- 3. Tabla de Clientes / Huéspedes (PMS)
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    dni_pasaporte TEXT UNIQUE NOT NULL,
    telefono TEXT,
    email TEXT
);

-- 4. Tabla de Reservas (PMS)
CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitacion_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    fecha_entrada TEXT NOT NULL,
    fecha_salida TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'confirmada' CHECK(estado IN ('confirmada', 'check-in', 'check-out', 'cancelada')),
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- 5. Tabla de Partes de Mantenimiento / Incidencias (GMAO)
CREATE TABLE IF NOT EXISTS mantenimiento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitacion_id INTEGER,
    usuario_id INTEGER, -- Empleado asignado para resolver la incidencia
    descripcion TEXT NOT NULL,
    prioridad TEXT NOT NULL DEFAULT 'media' CHECK(prioridad IN ('baja', 'media', 'alta', 'urgente')),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'en_proceso', 'resuelto')),
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
