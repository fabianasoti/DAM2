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
    pais TEXT NOT NULL DEFAULT 'España',
    -- Campos adaptados al hotel
    idioma TEXT NOT NULL DEFAULT 'Español'
        CHECK (idioma IN ('Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués')),
    observaciones TEXT,
    id_externo INTEGER              -- identificador de este cliente en el otro sistema (darkorange)
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

-- =========================================================
-- Vistas: consultas guardadas que se usan como si fueran tablas
-- =========================================================

-- Reserva con los datos de su habitación y su cliente
CREATE VIEW v_reservas_detalle AS
SELECT r.id, r.fecha_entrada, r.fecha_salida,
       CAST(julianday(r.fecha_salida) - julianday(r.fecha_entrada) AS INTEGER) AS noches,
       r.estado, r.canal, r.importe_total, r.num_huespedes,
       r.habitacion_id, r.cliente_id,
       h.numero AS habitacion, h.tipo,
       c.nombre || ' ' || c.apellidos AS cliente, c.pais
FROM reservas r
JOIN habitaciones h ON h.id = r.habitacion_id
JOIN clientes c ON c.id = r.cliente_id;

-- Historial de cada cliente que se ha alojado
CREATE VIEW v_clientes_resumen AS
SELECT cliente_id, cliente, pais,
       COUNT(*) AS estancias,
       SUM(noches) AS noches,
       ROUND(SUM(importe_total), 2) AS gasto,
       MAX(fecha_entrada) AS ultima_visita
FROM v_reservas_detalle
WHERE estado IN ('check-in', 'check-out')
GROUP BY cliente_id;

-- Reservas e ingresos por país de procedencia
CREATE VIEW v_paises AS
SELECT pais,
       COUNT(*) AS reservas,
       SUM(noches) AS noches,
       ROUND(SUM(importe_total), 2) AS ingresos
FROM v_reservas_detalle
WHERE estado <> 'cancelada'
GROUP BY pais;

-- =========================================================
-- Facturación
-- =========================================================
-- Una factura por estancia. Los precios llevan el IVA incluido (10 % en alojamiento)
CREATE TABLE facturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,                       -- F2026-00001
    reserva_id INTEGER NOT NULL UNIQUE REFERENCES reservas (id),
    cliente_id INTEGER NOT NULL REFERENCES clientes (id),
    fecha TEXT NOT NULL,
    base REAL NOT NULL CHECK (base >= 0),
    iva_porcentaje REAL NOT NULL DEFAULT 10,
    iva REAL NOT NULL CHECK (iva >= 0),
    total REAL NOT NULL CHECK (total >= 0),
    forma_pago TEXT NOT NULL CHECK (forma_pago IN ('tarjeta', 'efectivo', 'transferencia', 'plataforma')),
    enviada TEXT                    -- cuándo se envió al otro sistema (vacío = pendiente)
);
CREATE INDEX idx_facturas_fecha ON facturas (fecha);

CREATE VIEW v_facturas AS
SELECT f.*, r.fecha_entrada, r.fecha_salida, r.canal,
       CAST(julianday(r.fecha_salida) - julianday(r.fecha_entrada) AS INTEGER) AS noches,
       h.numero AS habitacion, h.tipo,
       c.nombre || ' ' || c.apellidos AS cliente, c.dni_pasaporte, c.email, c.pais
FROM facturas f
JOIN reservas r ON r.id = f.reserva_id
JOIN habitaciones h ON h.id = r.habitacion_id
JOIN clientes c ON c.id = f.cliente_id;

-- =========================================================
-- Procedimientos del servidor de datos (triggers)
-- SQLite no tiene procedimientos almacenados: la lógica que vive dentro
-- de la base de datos se escribe como triggers, que se ejecutan solos.
-- =========================================================

-- Al hacer el check-out se emite la factura, con el siguiente número del año
CREATE TRIGGER facturar_al_checkout
AFTER UPDATE OF estado ON reservas
WHEN NEW.estado = 'check-out' AND OLD.estado <> 'check-out' AND NEW.importe_total > 0
 AND NOT EXISTS (SELECT 1 FROM facturas WHERE reserva_id = NEW.id)
BEGIN
    INSERT INTO facturas (numero, reserva_id, cliente_id, fecha, base, iva, total, forma_pago)
    VALUES (
        'F' || strftime('%Y', 'now', 'localtime') || '-' || printf('%05d', COALESCE(
            (SELECT MAX(CAST(substr(numero, 7) AS INTEGER)) FROM facturas
             WHERE numero LIKE 'F' || strftime('%Y', 'now', 'localtime') || '-%'), 0) + 1),
        NEW.id, NEW.cliente_id, date('now', 'localtime'),
        round(NEW.importe_total / 1.10, 2),
        round(NEW.importe_total - round(NEW.importe_total / 1.10, 2), 2),
        NEW.importe_total,
        CASE WHEN NEW.canal = 'agencia' THEN 'plataforma' ELSE 'tarjeta' END);
END;

-- Una factura emitida no se puede cambiar ni borrar
CREATE TRIGGER factura_sin_cambios
BEFORE UPDATE OF numero, reserva_id, cliente_id, fecha, base, iva_porcentaje, iva, total ON facturas
BEGIN
    SELECT RAISE(ABORT, 'Una factura emitida no se puede modificar');
END;

CREATE TRIGGER factura_sin_borrado
BEFORE DELETE ON facturas
BEGIN
    SELECT RAISE(ABORT, 'Una factura emitida no se puede borrar');
END;

-- Cada cambio de precio de una habitación queda anotado en la auditoría
CREATE TRIGGER auditar_cambio_de_precio
AFTER UPDATE OF precio_noche ON habitaciones
WHEN OLD.precio_noche <> NEW.precio_noche
BEGIN
    INSERT INTO auditoria (accion, detalle)
    VALUES ('cambio de precio', 'habitación ' || NEW.numero || ': ' || OLD.precio_noche || ' -> ' || NEW.precio_noche);
END;
