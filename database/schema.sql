-- ============================================
-- SISTEMA DE GESTIÓN DE INVENTARIO DE REACTIVOS
-- Base de datos para el Laboratorio de Nanotecnología
-- Universidad Tecnológica de Querétaro
-- ============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS inventario_reactivos
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE inventario_reactivos;

-- ============================================
-- TABLA: clasificaciones
-- Almacena los tipos de clasificación de reactivos
-- ============================================
CREATE TABLE IF NOT EXISTS clasificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE COMMENT 'Código corto para identificación rápida (ej: ACD, BAS, OXI)',
    color_hex VARCHAR(7) NOT NULL COMMENT 'Color hexadecimal para identificación visual',
    nivel_peligro ENUM('bajo', 'medio', 'alto', 'muy_alto') DEFAULT 'bajo',
    descripcion TEXT,
    icono VARCHAR(50) COMMENT 'Nombre del icono a usar en la interfaz',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: reactivos
-- Almacena la información principal de cada reactivo químico
-- ============================================
CREATE TABLE IF NOT EXISTS reactivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre del reactivo químico',
    formula_quimica VARCHAR(100) COMMENT 'Fórmula química del reactivo (ej: H2SO4, NaCl)',
    clasificacion_id INT NOT NULL COMMENT 'FK a clasificaciones',
    cas_number VARCHAR(20) COMMENT 'Número CAS (Chemical Abstracts Service)',
    presentacion VARCHAR(100) COMMENT 'Presentación del reactivo (ej: polvo, líquido, solución)',
    cantidad_actual DECIMAL(10, 2) DEFAULT 0 COMMENT 'Cantidad disponible en inventario',
    unidad_medida VARCHAR(20) DEFAULT 'ml' COMMENT 'Unidad de medida (ml, g, kg, L)',
    cantidad_minima DECIMAL(10, 2) DEFAULT 0 COMMENT 'Cantidad mínima para alerta de reabastecimiento',
    ubicacion VARCHAR(100) COMMENT 'Ubicación física en el laboratorio',
    numero_frascos INT DEFAULT 1 COMMENT 'Número de contenedores/frascos',
    lote VARCHAR(50) COMMENT 'Número de lote del fabricante',
    fecha_caducidad DATE COMMENT 'Fecha de caducidad del reactivo',
    fabricante VARCHAR(100) COMMENT 'Nombre del fabricante',
    proveedor VARCHAR(100) COMMENT 'Proveedor del reactivo',
    precio_unitario DECIMAL(10, 2) COMMENT 'Precio por unidad',
    observaciones TEXT COMMENT 'Notas adicionales o precauciones especiales',
    codigo_qr VARCHAR(255) UNIQUE NOT NULL COMMENT 'Código QR único generado',
    qr_imagen_path VARCHAR(255) COMMENT 'Ruta de la imagen QR generada',
    estado ENUM('activo', 'agotado', 'suspendido', 'caducado') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) COMMENT 'Usuario que registró el reactivo',
    
    -- Índices para mejorar el rendimiento
    INDEX idx_nombre (nombre),
    INDEX idx_formula (formula_quimica),
    INDEX idx_clasificacion (clasificacion_id),
    INDEX idx_codigo_qr (codigo_qr),
    INDEX idx_estado (estado),
    
    -- Llave foránea
    FOREIGN KEY (clasificacion_id) REFERENCES clasificaciones(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: historial_movimientos
-- Registra todos los movimientos de entrada/salida de reactivos
-- ============================================
CREATE TABLE IF NOT EXISTS historial_movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reactivo_id INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'caducidad') NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    cantidad_anterior DECIMAL(10, 2) NOT NULL COMMENT 'Cantidad antes del movimiento',
    cantidad_posterior DECIMAL(10, 2) NOT NULL COMMENT 'Cantidad después del movimiento',
    motivo VARCHAR(255) COMMENT 'Razón del movimiento',
    responsable VARCHAR(100) COMMENT 'Persona responsable del movimiento',
    documento_referencia VARCHAR(100) COMMENT 'Número de documento de respaldo',
    observaciones TEXT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_reactivo (reactivo_id),
    INDEX idx_fecha (fecha_movimiento),
    INDEX idx_tipo (tipo_movimiento),
    
    -- Llave foránea
    FOREIGN KEY (reactivo_id) REFERENCES reactivos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: usuarios (opcional para futuras mejoras)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150),
    rol ENUM('admin', 'usuario', 'invitado') DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERTAR DATOS INICIALES: Clasificaciones
-- ============================================
INSERT INTO clasificaciones (nombre, codigo, color_hex, nivel_peligro, descripcion, icono) VALUES
-- Clasificación por función
('Ácido', 'ACD', '#FF4444', 'alto', 'Sustancias que liberan iones H+ en solución acuosa', 'flask-round-poison'),
('Base', 'BAS', '#4444FF', 'alto', 'Sustancias que liberan iones OH- en solución acuosa', 'flask-round'),
('Oxidante', 'OXI', '#FF8C00', 'muy_alto', 'Sustancias que facilitan la oxidación de otros compuestos', 'fire'),
('Reductor', 'RED', '#9370DB', 'medio', 'Sustancias que facilitan la reducción de otros compuestos', 'atom'),
('Disolvente', 'DIS', '#00CED1', 'medio', 'Sustancias que disuelven otras sustancias', 'droplet'),
('Indicador', 'IND', '#FFD700', 'bajo', 'Sustancias que cambian de color según el pH u otras condiciones', 'eye'),
('Catalizador', 'CAT', '#32CD32', 'medio', 'Sustancias que aceleran reacciones químicas sin consumirse', 'rocket'),

-- Clasificación por peligrosidad
('Tóxico', 'TOX', '#8B0000', 'muy_alto', 'Sustancias nocivas para la salud humana', 'skull'),
('Inflamable', 'INF', '#FF4500', 'muy_alto', 'Sustancias que se encienden fácilmente', 'flame'),
('Corrosivo', 'COR', '#DC143C', 'muy_alto', 'Sustancias que destruyen tejidos vivos y materiales', 'flask-round-poison'),
('Explosivo', 'EXP', '#B22222', 'muy_alto', 'Sustancias que pueden detonar o explotar', 'bomb'),
('Irritante', 'IRR', '#FFA500', 'medio', 'Sustancias que causan irritación en piel o mucosas', 'alert-circle'),

-- Clasificación por pureza
('Grado Técnico', 'TEC', '#808080', 'bajo', 'Pureza estándar para uso general', 'tag'),
('Grado Analítico', 'ANA', '#4169E1', 'bajo', 'Alta pureza para análisis químico', 'microscope'),
('Grado HPLC', 'HPLC', '#0000CD', 'bajo', 'Pureza para cromatografía líquida de alta resolución', 'test-tube'),
('Grado Reactivo', 'REA', '#6495ED', 'bajo', 'Pureza para síntesis química', 'flask-conical'),

-- Clasificación por aplicación
('Bioquímico', 'BIO', '#228B22', 'bajo', 'Reactivos para aplicaciones biológicas', 'dna'),
('Síntesis', 'SIN', '#4B0082', 'medio', 'Reactivos para síntesis química', 'flask-conical'),
('Sal', 'SAL', '#87CEEB', 'bajo', 'Compuestos iónicos', 'salt'),
('Solvente Orgánico', 'SOL', '#20B2AA', 'medio', 'Disolventes basados en carbono', 'droplet'),
('Buffer', 'BUF', '#3CB371', 'bajo', 'Soluciones reguladoras de pH', 'beaker'),
('Estándar', 'EST', '#DAA520', 'bajo', 'Sustancias de referencia para calibración', 'target')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Reactivos con información completa
CREATE OR REPLACE VIEW vista_reactivos_completa AS
SELECT 
    r.id,
    r.nombre,
    r.formula_quimica,
    r.codigo_qr,
    r.cantidad_actual,
    r.unidad_medida,
    r.numero_frascos,
    r.estado,
    r.ubicacion,
    r.fecha_caducidad,
    r.lote,
    r.fabricante,
    r.clasificacion_id
    c.nombre AS clasificacion,
    c.codigo AS clasificacion_codigo,
    c.color_hex,
    c.nivel_peligro,
    c.icono,
    r.created_at,
    r.updated_at,
    CASE 
        WHEN r.cantidad_actual <= r.cantidad_minima THEN 'ALERTA: Stock bajo'
        WHEN r.fecha_caducidad <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'ADVERTENCIA: Próximo a caducar'
        WHEN r.estado = 'agotado' THEN 'AGOTADO'
        ELSE 'OK'
    END AS estado_inventario
FROM reactivos r
INNER JOIN clasificaciones c ON r.clasificacion_id = c.id;

-- Vista: Estadísticas de inventario
CREATE OR REPLACE VIEW vista_estadisticas AS
SELECT 
    c.nombre AS clasificacion,
    COUNT(r.id) AS total_reactivos,
    SUM(CASE WHEN r.estado = 'activo' THEN 1 ELSE 0 END) AS activos,
    SUM(CASE WHEN r.estado = 'agotado' THEN 1 ELSE 0 END) AS agotados,
    SUM(CASE WHEN r.cantidad_actual <= r.cantidad_minima THEN 1 ELSE 0 END) AS stock_bajo,
    SUM(r.numero_frascos) AS total_frascos
FROM reactivos r
INNER JOIN clasificaciones c ON r.clasificacion_id = c.id
GROUP BY c.id, c.nombre;

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================

-- Procedimiento: Registrar movimiento de reactivo
DELIMITER //
CREATE PROCEDURE registrar_movimiento(
    IN p_reactivo_id INT,
    IN p_tipo_movimiento ENUM('entrada', 'salida', 'ajuste', 'caducidad'),
    IN p_cantidad DECIMAL(10, 2),
    IN p_motivo VARCHAR(255),
    IN p_responsable VARCHAR(100)
)
BEGIN
    DECLARE v_cantidad_anterior DECIMAL(10, 2);
    DECLARE v_cantidad_posterior DECIMAL(10, 2);
    
    -- Obtener cantidad actual
    SELECT cantidad_actual INTO v_cantidad_anterior 
    FROM reactivos 
    WHERE id = p_reactivo_id;
    
    -- Calcular nueva cantidad
    IF p_tipo_movimiento = 'entrada' THEN
        SET v_cantidad_posterior = v_cantidad_anterior + p_cantidad;
    ELSEIF p_tipo_movimiento IN ('salida', 'caducidad') THEN
        SET v_cantidad_posterior = v_cantidad_anterior - p_cantidad;
    ELSE
        SET v_cantidad_posterior = p_cantidad; -- ajuste directo
    END IF;
    
    -- Actualizar cantidad en reactivos
    UPDATE reactivos 
    SET cantidad_actual = v_cantidad_posterior,
        estado = CASE 
            WHEN v_cantidad_posterior <= 0 THEN 'agotado'
            ELSE estado
        END
    WHERE id = p_reactivo_id;
    
    -- Registrar en historial
    INSERT INTO historial_movimientos (
        reactivo_id, tipo_movimiento, cantidad, 
        cantidad_anterior, cantidad_posterior, 
        motivo, responsable
    ) VALUES (
        p_reactivo_id, p_tipo_movimiento, p_cantidad,
        v_cantidad_anterior, v_cantidad_posterior,
        p_motivo, p_responsable
    );
END //
DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Verificar stock bajo después de actualización
DELIMITER //
CREATE TRIGGER verificar_stock_bajo
AFTER UPDATE ON reactivos
FOR EACH ROW
BEGIN
    IF NEW.cantidad_actual <= NEW.cantidad_minima AND OLD.cantidad_actual > OLD.cantidad_minima THEN
        -- Aquí podrías insertar en una tabla de alertas o enviar notificaciones
        INSERT INTO historial_movimientos (
            reactivo_id, tipo_movimiento, cantidad,
            cantidad_anterior, cantidad_posterior,
            motivo, responsable
        ) VALUES (
            NEW.id, 'ajuste', 0,
            OLD.cantidad_actual, NEW.cantidad_actual,
            'ALERTA AUTOMÁTICA: Stock por debajo del mínimo',
            'SISTEMA'
        );
    END IF;
END //
DELIMITER ;


-- CREA LA TABLA DE VISTAS DE LOS REACTIVOS A CADUCAR:
CREATE OR REPLACE VIEW vista_alertas_caducidad AS
    -> SELECT
    ->   r.id,
    ->   r.nombre,
    ->   r.fecha_caducidad,
    ->   DATEDIFF(r.fecha_caducidad, CURDATE()) AS dias_restantes,
    ->   c.nombre AS clasificacion,
    ->   c.color_hex
    -> FROM reactivos r
    -> JOIN clasificaciones c ON r.clasificacion_id = c.id
    -> WHERE r.fecha_caducidad IS NOT NULL
    ->   AND r.estado = 'activo'
    ->   AND r.fecha_caducidad <= DATE_ADD(CURDATE(), INTERVAL 30 DAY);

-- ============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================
ALTER TABLE reactivos ADD FULLTEXT INDEX idx_nombre_formula (nombre, formula_quimica);

-- ============================================
-- USUARIO DE APLICACIÓN (recomendado para producción)
-- ============================================
-- CREATE USER 'app_reactivos'@'localhost' IDENTIFIED BY 'password_seguro_aqui';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON inventario_reactivos.* TO 'app_reactivos'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================