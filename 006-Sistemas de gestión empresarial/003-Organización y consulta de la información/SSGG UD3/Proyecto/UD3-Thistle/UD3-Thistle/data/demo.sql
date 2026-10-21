-- ==========================================
-- SCRIPT COMPLETO DE DATOS DE PRUEBA (demo.sql)
-- Sistema PMS + GMAO - Hotel de 50 habitaciones (73% ocupación)
-- ==========================================

-- 1. USUARIOS / EMPLEADOS (Administración, Recepción, Mantenimiento, Housekeeping)
INSERT INTO usuarios (nombre, email, password, rol) VALUES
-- Administración
('Lucía Admin', 'admin@hotel.com', 'admin123', 'admin'),

-- Recepción (9 recepcionistas)
('Ana Gómez', 'ana.recepcion@hotel.com', '1234', 'recepcion'),
('Carlos Ruiz', 'carlos.recepcion@hotel.com', '1234', 'recepcion'),
('Elena Torres', 'elena.recepcion@hotel.com', '1234', 'recepcion'),
('David Morales', 'david.recepcion@hotel.com', '1234', 'recepcion'),
('Sofía Navarro', 'sofia.recepcion@hotel.com', '1234', 'recepcion'),
('Javier Gil', 'javier.recepcion@hotel.com', '1234', 'recepcion'),
('Carmen Blanco', 'carmen.recepcion@hotel.com', '1234', 'recepcion'),
('Miguel Ángel Soria', 'miguel.recepcion@hotel.com', '1234', 'recepcion'),
('Laura Prieto', 'laura.recepcion@hotel.com', '1234', 'recepcion'),

-- Mantenimiento (3 empleados)
('Pedro Mecánico', 'pedro.mantenimiento@hotel.com', '1234', 'mantenimiento'),
('Roberto Fix', 'roberto.mantenimiento@hotel.com', '1234', 'mantenimiento'),
('Tomás Obras', 'tomas.mantenimiento@hotel.com', '1234', 'mantenimiento'),

-- Housekeeping / Limpieza (10 empleados)
('Rosa Limpieza', 'rosa.limpieza@hotel.com', '1234', 'limpieza'),
('Juana Clean', 'juana.limpieza@hotel.com', '1234', 'limpieza'),
('Beatriz Pura', 'beatriz.pura@hotel.com', '1234', 'limpieza'),
('Teresa Brilla', 'teresa.brilla@hotel.com', '1234', 'limpieza'),
('Carmen Pulida', 'carmen.pulida@hotel.com', '1234', 'limpieza'),
('Lucía Nítida', 'lucia.nitida@hotel.com', '1234', 'limpieza'),
('Marta Impecable', 'marta.impecable@hotel.com', '1234', 'limpieza'),
('Inés Clara', 'ines.clara@hotel.com', '1234', 'limpieza'),
('Pilar Fresca', 'pilar.fresca@hotel.com', '1234', 'limpieza'),
('Gloria Limpia', 'gloria.limpia@hotel.com', '1234', 'limpieza');


-- 2. HABITACIONES (50 habitaciones en 5 pisos)
-- Planta 1 (101 a 110)
INSERT INTO habitaciones (numero, tipo, precio_noche, estado) VALUES
('101', 'Individual', 60.00, 'ocupada'), ('102', 'Individual', 60.00, 'ocupada'), ('103', 'Doble', 90.00, 'ocupada'), ('104', 'Doble', 90.00, 'ocupada'), ('105', 'Doble', 90.00, 'ocupada'),
('106', 'Suite', 150.00, 'ocupada'), ('107', 'Individual', 60.00, 'ocupada'), ('108', 'Doble', 90.00, 'ocupada'), ('109', 'Doble', 90.00, 'disponible'), ('110', 'Suite', 150.00, 'sucia');

-- Planta 2 (201 a 210)
INSERT INTO habitaciones (numero, tipo, precio_noche, estado) VALUES
('201', 'Individual', 65.00, 'ocupada'), ('202', 'Individual', 65.00, 'ocupada'), ('203', 'Doble', 95.00, 'ocupada'), ('204', 'Doble', 95.00, 'ocupada'), ('205', 'Doble', 95.00, 'ocupada'),
('206', 'Suite', 160.00, 'ocupada'), ('207', 'Individual', 65.00, 'ocupada'), ('208', 'Doble', 95.00, 'ocupada'), ('209', 'Doble', 95.00, 'ocupada'), ('210', 'Individual', 65.00, 'mantenimiento');

-- Planta 3 (301 a 310)
INSERT INTO habitaciones (numero, tipo, precio_noche, estado) VALUES
('301', 'Individual', 70.00, 'ocupada'), ('302', 'Individual', 70.00, 'ocupada'), ('303', 'Doble', 100.00, 'ocupada'), ('304', 'Doble', 100.00, 'ocupada'), ('305', 'Doble', 100.00, 'ocupada'),
('306', 'Suite', 170.00, 'ocupada'), ('307', 'Individual', 70.00, 'ocupada'), ('308', 'Doble', 100.00, 'ocupada'), ('309', 'Doble', 100.00, 'disponible'), ('310', 'Doble', 100.00, 'sucia');

-- Planta 4 (401 a 410)
INSERT INTO habitaciones (numero, tipo, precio_noche, estado) VALUES
('401', 'Individual', 75.00, 'ocupada'), ('402', 'Individual', 75.00, 'ocupada'), ('403', 'Doble', 110.00, 'ocupada'), ('404', 'Doble', 110.00, 'ocupada'), ('405', 'Doble', 110.00, 'ocupada'),
('406', 'Suite', 180.00, 'ocupada'), ('407', 'Individual', 75.00, 'ocupada'), ('408', 'Doble', 110.00, 'ocupada'), ('409', 'Doble', 110.00, 'ocupada'), ('410', 'Suite', 180.00, 'disponible');

-- Planta 5 (501 a 510)
INSERT INTO habitaciones (numero, tipo, precio_noche, estado) VALUES
('501', 'Individual', 80.00, 'ocupada'), ('502', 'Individual', 80.00, 'ocupada'), ('503', 'Doble', 120.00, 'ocupada'), ('504', 'Doble', 120.00, 'ocupada'), ('505', 'Doble', 120.00, 'ocupada'),
('506', 'Suite', 200.00, 'ocupada'), ('507', 'Individual', 80.00, 'ocupada'), ('508', 'Doble', 120.00, 'ocupada'), ('509', 'Doble', 120.00, 'mantenimiento'), ('510', 'Suite', 200.00, 'sucia');


-- 3. CLIENTES / HUÉSPEDES (36 clientes para las 36 habitaciones ocupadas)
INSERT INTO clientes (nombre, apellidos, dni_pasaporte, telefono, email) VALUES
('Juan', 'Martínez López', '12345678X', '+34600111222', 'juan.martinez@email.com'),
('María', 'Rodríguez Sanz', '87654321Y', '+34655333444', 'maria.rodriguez@email.com'),
('Antonio', 'García Pérez', '11223344A', '+34611223344', 'antonio.garcia@email.com'),
('Carmen', 'López Gómez', '22334455B', '+34622334455', 'carmen.lopez@email.com'),
('José', 'Fernández Ruiz', '33445566C', '+34633445566', 'jose.fernandez@email.com'),
('Ana', 'Martín Sánchez', '44556677D', '+34644556677', 'ana.martin@email.com'),
('Francisco', 'Gómez Díaz', '55667788E', '+34655667788', 'francisco.gomez@email.com'),
('Isabel', 'Jiménez Moreno', '66778899F', '+34666778899', 'isabel.jimenez@email.com'),
('David', 'Ruiz Álvarez', '77889900G', '+34677889900', 'david.ruiz@email.com'),
('María Dolores', 'Hernández Romero', '88990011H', '+34688990011', 'dolores.hernandez@email.com'),
('Javier', 'Díaz Alonso', '99001122I', '+34699001122', 'javier.diaz@email.com'),
('Elena', 'Moreno Gutiérrez', '10111213J', '+34610111213', 'elena.moreno@email.com'),
('Manuel', 'Muñoz Navarro', '21222324K', '+34621222324', 'manuel.munoz@email.com'),
('Rosa', 'Álvarez Torres', '32333435L', '+34632333435', 'rosa.alvarez@email.com'),
('Alejandro', 'Romero Domínguez', '43444546M', '+34643444546', 'alejandro.romero@email.com'),
('Patricia', 'Gutiérrez Vázquez', '54555657N', '+34654555657', 'patricia.gutierrez@email.com'),
('Daniel', 'Alonso Ramos', '65666768O', '+34665666768', 'daniel.alonso@email.com'),
('Beatriz', 'Serrano Blanco', '76777879P', '+34676777879', 'beatriz.serrano@email.com'),
('Carlos', 'Navarro Gil', '87888990Q', '+34687888990', 'carlos.navarro@email.com'),
('Laura', 'Torres Molina', '98990001R', '+34698990001', 'laura.torres@email.com'),
('Jorge', 'Domínguez Ortiz', '12131415S', '+34612131415', 'jorge.dominguez@email.com'),
('Sara', 'Vázquez Rubio', '23242526T', '+34623242526', 'sara.vazquez@email.com'),
('Adrián', 'Ramos Medina', '34353637U', '+34634353637', 'adrian.ramos@email.com'),
('Paula', 'Blanco Castro', '45464748V', '+34645464748', 'paula.blanco@email.com'),
('Pablo', 'Gil Iglesias', '56575859W', '+34656575859', 'pablo.gil@email.com'),
('Lucía', 'Molina Santos', '67686970X', '+34667686970', 'lucia.molina@email.com'),
('Álvaro', 'Ortiz Delgado', '78798081Y', '+34678798081', 'alvaro.ortiz@email.com'),
('Marta', 'Rubio Marín', '89909192Z', '+34689909192', 'marta.rubio@email.com'),
('Sergio', 'Medina Vega', '90010203A', '+34690010203', 'sergio.medina@email.com'),
('Clara', 'Castro Garrido', '01122334B', '+34601122334', 'clara.castro@email.com'),
('Rubén', 'Iglesias Cano', '12233445C', '+34612233445', 'ruben.iglesias@email.com'),
('Nuria', 'Santos Cruz', '23344556D', '+34623344556', 'nuria.santos@email.com'),
('Víctor', 'Delgado Flores', '34455667E', '+34634455667', 'victor.delgado@email.com'),
('Silvia', 'Marín Campos', '45566778F', '+34645566778', 'silvia.marin@email.com'),
('Raúl', 'Vega Prieto', '56677889G', '+34656677889', 'raul.vega@email.com'),
('Eva', 'Garrido León', '67788990H', '+34667788990', 'eva.garrido@email.com');


-- 4. RESERVAS (36 reservas activas asociadas a las 36 habitaciones ocupadas)
INSERT INTO reservas (habitacion_id, cliente_id, fecha_entrada, fecha_salida, estado) VALUES
(1, 1, '2026-06-01', '2026-06-06', 'check-in'),
(2, 2, '2026-06-02', '2026-06-07', 'check-in'),
(3, 3, '2026-06-03', '2026-06-08', 'check-in'),
(4, 4, '2026-06-01', '2026-06-05', 'check-in'),
(5, 5, '2026-06-02', '2026-06-09', 'check-in'),
(6, 6, '2026-06-04', '2026-06-10', 'check-in'),
(7, 7, '2026-06-01', '2026-06-04', 'check-in'),
(8, 8, '2026-06-03', '2026-06-11', 'check-in'),
(10, 9, '2026-06-02', '2026-06-06', 'check-in'),
(11, 10, '2026-06-01', '2026-06-08', 'check-in'),
(12, 11, '2026-06-03', '2026-06-07', 'check-in'),
(13, 12, '2026-06-04', '2026-06-12', 'check-in'),
(14, 13, '2026-06-02', '2026-06-05', 'check-in'),
(15, 14, '2026-06-01', '2026-06-10', 'check-in'),
(16, 15, '2026-06-03', '2026-06-09', 'check-in'),
(17, 16, '2026-06-05', '2026-06-13', 'check-in'),
(18, 17, '2026-06-01', '2026-06-06', 'check-in'),
(19, 18, '2026-06-02', '2026-06-08', 'check-in'),
(21, 19, '2026-06-01', '2026-06-07', 'check-in'),
(22, 20, '2026-06-03', '2026-06-10', 'check-in'),
(23, 21, '2026-06-04', '2026-06-11', 'check-in'),
(24, 22, '2026-06-02', '2026-06-05', 'check-in'),
(25, 23, '2026-06-01', '2026-06-09', 'check-in'),
(26, 24, '2026-06-03', '2026-06-12', 'check-in'),
(27, 25, '2026-06-05', '2026-06-14', 'check-in'),
(28, 26, '2026-06-02', '2026-06-08', 'check-in'),
(29, 27, '2026-06-01', '2026-06-06', 'check-in'),
(31, 28, '2026-06-03', '2026-06-10', 'check-in'),
(32, 29, '2026-06-04', '2026-06-11', 'check-in'),
(33, 30, '2026-06-01', '2026-06-05', 'check-in'),
(34, 31, '2026-06-02', '2026-06-08', 'check-in'),
(35, 32, '2026-06-05', '2026-06-15', 'check-in'),
(36, 33, '2026-06-01', '2026-06-07', 'check-in'),
(37, 34, '2026-06-03', '2026-06-09', 'check-in'),
(38, 35, '2026-06-04', '2026-06-12', 'check-in'),
(39, 36, '2026-06-02', '2026-06-06', 'check-in');


-- 5. PARTES DE MANTENIMIENTO / INCIDENCIAS (GMAO)
INSERT INTO mantenimiento (habitacion_id, usuario_id, descripcion, prioridad, estado) VALUES
(20, 11, 'Reparación de cerradura electrónica defectuosa', 'urgente', 'en_proceso'),
(10, 12, 'Sustitución de toalla y revisión de grifo que gotea', 'media', 'pendiente'),
(30, 13, 'Revisión general del sistema de climatización y filtros', 'baja', 'pendiente'),
(50, 11, 'Reparación de persiana atascada en el balcón', 'alta', 'pendiente');
