-- =========================================================
-- Thistle PMS · procedimientos almacenados de servidor (MySQL)
-- =========================================================
-- La aplicación funciona con SQLite, que no tiene procedimientos almacenados.
-- Este script adapta a MySQL la parte de facturación con tres procedimientos.
-- Crea su propia base de datos de demostración (thistle_mysql) con pocos datos:
-- no toca ninguna otra base de datos.
--
-- Ejecutar (pide la contraseña de MySQL):
--   mysql -u root -p < "data/004-procedimientos mysql.sql"

DROP DATABASE IF EXISTS thistle_mysql;
CREATE DATABASE thistle_mysql CHARACTER SET utf8mb4;
USE thistle_mysql;
SET NAMES utf8mb4;

-- ---------- Tablas (versión reducida del esquema de Thistle) ----------
CREATE TABLE habitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL,
    precio_noche DECIMAL(8,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible'
);

CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habitacion_id INT NOT NULL,
    cliente VARCHAR(100) NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'confirmada',
    importe_total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones (id)
);

CREATE TABLE facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    reserva_id INT NOT NULL UNIQUE,
    fecha DATE NOT NULL,
    base DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (reserva_id) REFERENCES reservas (id)
);

-- ---------- Datos de ejemplo (inventados) ----------
INSERT INTO habitaciones (numero, tipo, precio_noche, estado) VALUES
    ('101', 'Individual', 70.00, 'ocupada'),
    ('201', 'Doble', 100.00, 'ocupada'),
    ('301', 'Doble', 105.00, 'disponible'),
    ('501', 'Suite', 180.00, 'disponible');

INSERT INTO reservas (habitacion_id, cliente, fecha_entrada, fecha_salida, estado, importe_total) VALUES
    (1, 'Cliente de ejemplo uno', CURDATE() - INTERVAL 2 DAY, CURDATE(), 'check-in', 140.00),
    (2, 'Cliente de ejemplo dos', CURDATE() - INTERVAL 3 DAY, CURDATE(), 'check-in', 330.00),
    (3, 'Cliente de ejemplo tres', CURDATE() + INTERVAL 5 DAY, CURDATE() + INTERVAL 8 DAY, 'confirmada', 315.00);

DELIMITER //

-- 1. Hace el check-out de una reserva y emite su factura, todo o nada
CREATE PROCEDURE hacer_checkout(IN p_reserva_id INT)
BEGIN
    DECLARE v_estado VARCHAR(20);
    DECLARE v_habitacion INT;
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_siguiente INT;
    DECLARE v_numero VARCHAR(20);

    -- Si algo falla, se deshace todo y se devuelve el error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- FOR UPDATE bloquea la reserva: nadie más puede cobrarla a la vez
    SELECT estado, habitacion_id, importe_total INTO v_estado, v_habitacion, v_total
    FROM reservas WHERE id = p_reserva_id FOR UPDATE;

    IF v_estado IS NULL OR v_estado <> 'check-in' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se puede hacer check-out de una reserva en check-in';
    END IF;

    UPDATE reservas SET estado = 'check-out' WHERE id = p_reserva_id;
    UPDATE habitaciones SET estado = 'sucia' WHERE id = v_habitacion;

    -- Siguiente número de factura del año: F2026-00001, F2026-00002...
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero, 7) AS UNSIGNED)), 0) + 1 INTO v_siguiente
    FROM facturas WHERE numero LIKE CONCAT('F', YEAR(CURDATE()), '-%') FOR UPDATE;
    SET v_numero = CONCAT('F', YEAR(CURDATE()), '-', LPAD(v_siguiente, 5, '0'));

    -- El precio lleva el IVA del 10 % incluido
    INSERT INTO facturas (numero, reserva_id, fecha, base, iva, total)
    VALUES (v_numero, p_reserva_id, CURDATE(), ROUND(v_total / 1.10, 2), v_total - ROUND(v_total / 1.10, 2), v_total);

    COMMIT;

    SELECT numero, base, iva, total FROM facturas WHERE numero = v_numero;
END //

-- 2. Resumen de lo facturado en un mes
CREATE PROCEDURE resumen_facturacion(IN p_anio INT, IN p_mes INT)
BEGIN
    SELECT COUNT(*) AS facturas,
           COALESCE(SUM(base), 0) AS base,
           COALESCE(SUM(iva), 0) AS iva,
           COALESCE(SUM(total), 0) AS total
    FROM facturas
    WHERE YEAR(fecha) = p_anio AND MONTH(fecha) = p_mes;
END //

-- 3. Habitaciones libres entre dos fechas
CREATE PROCEDURE habitaciones_libres(IN p_entrada DATE, IN p_salida DATE)
BEGIN
    IF p_salida <= p_entrada THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La salida debe ser posterior a la entrada';
    END IF;

    SELECT h.numero, h.tipo, h.precio_noche
    FROM habitaciones h
    WHERE NOT EXISTS (
        SELECT 1 FROM reservas r
        WHERE r.habitacion_id = h.id AND r.estado IN ('confirmada', 'check-in')
          AND r.fecha_entrada < p_salida AND p_entrada < r.fecha_salida
    )
    ORDER BY h.numero;
END //

DELIMITER ;

-- ---------- Demostración ----------
CALL hacer_checkout(1);
CALL hacer_checkout(2);
CALL resumen_facturacion(YEAR(CURDATE()), MONTH(CURDATE()));
CALL habitaciones_libres(CURDATE() + INTERVAL 6 DAY, CURDATE() + INTERVAL 7 DAY);
