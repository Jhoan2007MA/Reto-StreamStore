CREATE DATABASE IF NOT EXISTS streamStoreDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE streamStoreDb;

CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    estado TINYINT NOT NULL DEFAULT 1 COMMENT '1 = activo, 0 = inactivo',
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    contrasenaHash VARCHAR(255) NOT NULL,
    rolId INT UNSIGNED NOT NULL,
    estado TINYINT NOT NULL DEFAULT 1 COMMENT '1 = activo, 0 = inactivo',
    refreshToken VARCHAR(512) NULL,
    createdBy INT UNSIGNED NULL,
    updatedBy INT UNSIGNED NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_correo (correo),
    KEY idx_usuarios_rolId (rolId),
    CONSTRAINT fk_usuarios_rolId FOREIGN KEY (rolId) REFERENCES roles (id),
    CONSTRAINT fk_usuarios_createdBy FOREIGN KEY (createdBy) REFERENCES usuarios (id),
    CONSTRAINT fk_usuarios_updatedBy FOREIGN KEY (updatedBy) REFERENCES usuarios (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (id, nombre, descripcion)
VALUES
    (1, 'Superadmin', 'Acceso total al sistema'),
    (2, 'Administrador', 'Administra los catálogos y la operación')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Superadmin inicial: admin@streamstore.com / Admin123* (cambiar la contraseña después del primer inicio de sesión)
INSERT INTO usuarios (id, nombre, correo, contrasenaHash, rolId)
VALUES (1, 'Superadmin', 'admin@streamstore.com', '$2b$10$hWuCiQlhUU.ZqjakxB8Q0ezXQdugYYssHee7dW.mcb6gwWbYPK7hW', 1)
ON DUPLICATE KEY UPDATE correo = VALUES(correo);
