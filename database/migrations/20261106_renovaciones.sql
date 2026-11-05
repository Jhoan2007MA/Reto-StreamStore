USE streamStoreDb;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carritoItems' AND COLUMN_NAME = 'servicioId'
);
SET @sql := IF(@existe = 0,
    'ALTER TABLE carritoItems ADD COLUMN servicioId INT UNSIGNED NULL COMMENT ''Servicio que se renueva; NULL si es compra nueva'' AFTER productoId',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carritoItems' AND COLUMN_NAME = 'servicioClave'
);
SET @sql := IF(@existe = 0,
    'ALTER TABLE carritoItems ADD COLUMN servicioClave INT UNSIGNED AS (IFNULL(servicioId, 0)) STORED AFTER servicioId',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carritoItems' AND INDEX_NAME = 'uq_carritoItems_usuario_producto_servicio'
);
SET @sql := IF(@existe = 0,
    'ALTER TABLE carritoItems ADD UNIQUE KEY uq_carritoItems_usuario_producto_servicio (usuarioId, productoId, servicioClave)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carritoItems' AND INDEX_NAME = 'uq_carritoItems_usuario_producto'
);
SET @sql := IF(@existe > 0, 'ALTER TABLE carritoItems DROP INDEX uq_carritoItems_usuario_producto', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carritoItems' AND CONSTRAINT_NAME = 'fk_carritoItems_servicioId'
);
SET @sql := IF(@existe = 0,
    'ALTER TABLE carritoItems ADD CONSTRAINT fk_carritoItems_servicioId FOREIGN KEY (servicioId) REFERENCES servicios (id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'compraItems' AND COLUMN_NAME = 'servicioId'
);
SET @sql := IF(@existe = 0,
    'ALTER TABLE compraItems ADD COLUMN servicioId INT UNSIGNED NULL COMMENT ''Servicio que se renueva; NULL si es compra nueva'' AFTER productoId',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'compraItems' AND CONSTRAINT_NAME = 'fk_compraItems_servicioId'
);
SET @sql := IF(@existe = 0,
    'ALTER TABLE compraItems ADD CONSTRAINT fk_compraItems_servicioId FOREIGN KEY (servicioId) REFERENCES servicios (id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
