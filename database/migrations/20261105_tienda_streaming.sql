USE streamStoreDb;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'telefono'
);
SET @sql := IF(@existe = 0, 'ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20) NULL AFTER correo', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO roles (id, nombre, descripcion)
VALUES (3, 'Cliente', 'Compra y consulta sus servicios de streaming') AS nuevo
ON DUPLICATE KEY UPDATE nombre = nuevo.nombre;

CREATE TABLE IF NOT EXISTS plataformas (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255) NULL,
    logoUrl VARCHAR(500) NULL,
    maxPantallas TINYINT UNSIGNED NOT NULL DEFAULT 5,
    estado TINYINT NOT NULL DEFAULT 1 COMMENT '1 = activo, 0 = inactivo',
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_plataformas_nombre (nombre),
    CONSTRAINT fk_plataformas_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_plataformas_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    plataformaId INT UNSIGNED NOT NULL,
    tipo TINYINT NOT NULL COMMENT '1 = cuenta completa, 2 = pantalla',
    duracionDias SMALLINT UNSIGNED NOT NULL,
    precio DECIMAL(14,2) NOT NULL,
    estado TINYINT NOT NULL DEFAULT 1 COMMENT '1 = activo, 0 = inactivo',
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_productos_plataforma_tipo_duracion (plataformaId, tipo, duracionDias),
    CONSTRAINT fk_productos_plataformaId FOREIGN KEY (plataformaId) REFERENCES plataformas (id),
    CONSTRAINT fk_productos_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_productos_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cuentas (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    plataformaId INT UNSIGNED NOT NULL,
    correoAcceso VARCHAR(150) NOT NULL,
    contrasenaAcceso VARCHAR(512) NOT NULL COMMENT 'Cifrada con AES-256-GCM',
    estado TINYINT NOT NULL DEFAULT 1 COMMENT '1 = disponible, 2 = parcial, 3 = vendida, 0 = inactiva',
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cuentas_plataforma_correo (plataformaId, correoAcceso),
    KEY idx_cuentas_plataforma_estado (plataformaId, estado),
    CONSTRAINT fk_cuentas_plataformaId FOREIGN KEY (plataformaId) REFERENCES plataformas (id),
    CONSTRAINT fk_cuentas_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_cuentas_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pantallas (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    cuentaId INT UNSIGNED NOT NULL,
    nombrePerfil VARCHAR(50) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    estado TINYINT NOT NULL DEFAULT 1 COMMENT '1 = disponible, 2 = vendida',
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pantallas_cuenta_perfil (cuentaId, nombrePerfil),
    KEY idx_pantallas_cuenta_estado (cuentaId, estado),
    CONSTRAINT fk_pantallas_cuentaId FOREIGN KEY (cuentaId) REFERENCES cuentas (id),
    CONSTRAINT fk_pantallas_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_pantallas_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carritoItems (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuarioId INT UNSIGNED NOT NULL,
    productoId INT UNSIGNED NOT NULL,
    cantidad SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_carritoItems_usuario_producto (usuarioId, productoId),
    CONSTRAINT fk_carritoItems_usuarioId FOREIGN KEY (usuarioId) REFERENCES usuarios (id),
    CONSTRAINT fk_carritoItems_productoId FOREIGN KEY (productoId) REFERENCES productos (id),
    CONSTRAINT fk_carritoItems_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_carritoItems_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compras (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuarioId INT UNSIGNED NOT NULL,
    total DECIMAL(14,2) NOT NULL,
    estado TINYINT NOT NULL DEFAULT 1 COMMENT '1 = pendiente, 2 = pagada, 3 = cancelada',
    metodoPago VARCHAR(30) NULL,
    pagadaAt DATETIME NULL,
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_compras_usuario_estado (usuarioId, estado),
    KEY idx_compras_pagadaAt (pagadaAt),
    CONSTRAINT fk_compras_usuarioId FOREIGN KEY (usuarioId) REFERENCES usuarios (id),
    CONSTRAINT fk_compras_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_compras_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compraItems (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    compraId INT UNSIGNED NOT NULL,
    productoId INT UNSIGNED NOT NULL,
    cantidad SMALLINT UNSIGNED NOT NULL,
    precioUnitario DECIMAL(14,2) NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_compraItems_compraId FOREIGN KEY (compraId) REFERENCES compras (id),
    CONSTRAINT fk_compraItems_productoId FOREIGN KEY (productoId) REFERENCES productos (id),
    CONSTRAINT fk_compraItems_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_compraItems_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS servicios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    compraItemId INT UNSIGNED NOT NULL,
    usuarioId INT UNSIGNED NOT NULL,
    cuentaId INT UNSIGNED NOT NULL,
    pantallaId INT UNSIGNED NULL COMMENT 'NULL si es cuenta completa',
    fechaInicio DATETIME NOT NULL,
    fechaVencimiento DATETIME NOT NULL,
    estado TINYINT NOT NULL DEFAULT 1 COMMENT '1 = activo, 2 = vencido',
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_servicios_usuarioId (usuarioId),
    KEY idx_servicios_estado_vencimiento (estado, fechaVencimiento),
    CONSTRAINT fk_servicios_compraItemId FOREIGN KEY (compraItemId) REFERENCES compraItems (id),
    CONSTRAINT fk_servicios_usuarioId FOREIGN KEY (usuarioId) REFERENCES usuarios (id),
    CONSTRAINT fk_servicios_cuentaId FOREIGN KEY (cuentaId) REFERENCES cuentas (id),
    CONSTRAINT fk_servicios_pantallaId FOREIGN KEY (pantallaId) REFERENCES pantallas (id),
    CONSTRAINT fk_servicios_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_servicios_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificaciones (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    servicioId INT UNSIGNED NOT NULL,
    tipo TINYINT NOT NULL COMMENT '1 = 3 días, 2 = 1 día, 3 = vencido',
    enviadaAt DATETIME NOT NULL,
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_notificaciones_servicio_tipo (servicioId, tipo),
    CONSTRAINT fk_notificaciones_servicioId FOREIGN KEY (servicioId) REFERENCES servicios (id),
    CONSTRAINT fk_notificaciones_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_notificaciones_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
