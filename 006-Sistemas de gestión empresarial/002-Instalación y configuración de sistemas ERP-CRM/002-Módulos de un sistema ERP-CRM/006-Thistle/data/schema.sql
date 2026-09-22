PRAGMA foreign_keys = ON;

-- =========================================
-- CATEGORÍAS
-- =========================================

CREATE TABLE categorias (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT
);


-- =========================================
-- PROVEEDORES
-- =========================================

CREATE TABLE proveedores (
    id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    codigo_postal TEXT,
    pais TEXT DEFAULT 'España'
);


-- =========================================
-- PRODUCTOS
-- =========================================

CREATE TABLE productos (
    id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
    id_categoria INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    material TEXT NOT NULL,
    color TEXT NOT NULL,
    peso_gramos INTEGER NOT NULL,
    longitud_metros REAL,
    precio REAL NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    activo INTEGER NOT NULL DEFAULT 1,

    FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria),

    CHECK (peso_gramos > 0),
    CHECK (precio >= 0),
    CHECK (stock_actual >= 0),
    CHECK (stock_minimo >= 0),
    CHECK (activo IN (0, 1))
);


-- =========================================
-- RELACIÓN PRODUCTOS - PROVEEDORES
-- =========================================

CREATE TABLE producto_proveedor (
    id_producto INTEGER NOT NULL,
    id_proveedor INTEGER NOT NULL,
    precio_compra REAL,
    referencia_proveedor TEXT,

    PRIMARY KEY (id_producto, id_proveedor),

    FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto),

    FOREIGN KEY (id_proveedor)
        REFERENCES proveedores(id_proveedor),

    CHECK (precio_compra >= 0)
);


-- =========================================
-- CLIENTES
-- =========================================

CREATE TABLE clientes (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellidos TEXT,
    email TEXT UNIQUE,
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    codigo_postal TEXT,
    pais TEXT DEFAULT 'España',
    fecha_alta TEXT NOT NULL DEFAULT CURRENT_DATE
);


-- =========================================
-- PEDIDOS
-- =========================================

CREATE TABLE pedidos (
    id_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    fecha_pedido TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    direccion_envio TEXT,
    ciudad_envio TEXT,
    codigo_postal_envio TEXT,
    gastos_envio REAL NOT NULL DEFAULT 0,

    FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente),

    CHECK (
        estado IN (
            'pendiente',
            'confirmado',
            'preparando',
            'enviado',
            'entregado',
            'cancelado'
        )
    ),

    CHECK (gastos_envio >= 0)
);


-- =========================================
-- DETALLE DE LOS PEDIDOS
-- =========================================

CREATE TABLE detalle_pedido (
    id_pedido INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,

    PRIMARY KEY (id_pedido, id_producto),

    FOREIGN KEY (id_pedido)
        REFERENCES pedidos(id_pedido)
        ON DELETE CASCADE,

    FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto),

    CHECK (cantidad > 0),
    CHECK (precio_unitario >= 0)
);


-- =========================================
-- MOVIMIENTOS DE STOCK
-- =========================================

CREATE TABLE movimientos_stock (
    id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    motivo TEXT,

    FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto),

    CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    CHECK (cantidad > 0)
);


-- =========================================
-- ÍNDICES
-- =========================================

CREATE INDEX idx_productos_categoria
    ON productos(id_categoria);

CREATE INDEX idx_pedidos_cliente
    ON pedidos(id_cliente);

CREATE INDEX idx_pedidos_fecha
    ON pedidos(fecha_pedido);

CREATE INDEX idx_detalle_producto
    ON detalle_pedido(id_producto);

CREATE INDEX idx_movimientos_producto
    ON movimientos_stock(id_producto);
