USE streamStoreDb;

CREATE TABLE IF NOT EXISTS recuperacionesContrasena (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuarioId INT UNSIGNED NOT NULL,
    tokenHash CHAR(64) NOT NULL COMMENT 'SHA-256 del token enviado por correo',
    expiraAt DATETIME NOT NULL,
    usadoAt DATETIME NULL COMMENT 'NULL mientras el enlace no se haya usado ni invalidado',
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_recuperacionesContrasena_tokenHash (tokenHash),
    KEY idx_recuperacionesContrasena_usuario_usado (usuarioId, usadoAt),
    CONSTRAINT fk_recuperacionesContrasena_usuarioId FOREIGN KEY (usuarioId) REFERENCES usuarios (id),
    CONSTRAINT fk_recuperacionesContrasena_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_recuperacionesContrasena_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
