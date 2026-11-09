USE streamStoreDb;

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'verificadoAt'
);
SET @sql := IF(@existe = 0,
    'ALTER TABLE usuarios ADD COLUMN verificadoAt DATETIME NULL COMMENT ''NULL mientras el correo no se haya verificado'' AFTER estado',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(@existe = 0, 'UPDATE usuarios SET verificadoAt = createdAt WHERE verificadoAt IS NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS verificacionesCorreo (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuarioId INT UNSIGNED NOT NULL,
    codigoHash CHAR(64) NOT NULL COMMENT 'HMAC-SHA256 del código enviado por correo',
    expiraAt DATETIME NOT NULL,
    intentos TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Intentos de verificación realizados con este código',
    usadoAt DATETIME NULL COMMENT 'NULL mientras el código no se haya usado ni invalidado',
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_verificacionesCorreo_usuario_usado (usuarioId, usadoAt),
    CONSTRAINT fk_verificacionesCorreo_usuarioId FOREIGN KEY (usuarioId) REFERENCES usuarios (id),
    CONSTRAINT fk_verificacionesCorreo_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_verificacionesCorreo_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
