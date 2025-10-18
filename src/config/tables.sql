-- ============================================================================
-- TABLAS DEL SISTEMA AGRÍCOLA
-- ============================================================================

-- 1. TABLA DE CULTIVOS
CREATE TABLE IF NOT EXISTS cultivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  nombre_cientifico VARCHAR(255),
  tipo ENUM('Hortaliza', 'Fruta', 'Cereal', 'Leguminosa', 'Tubérculo', 'Flor', 'Otro') NOT NULL,
  ciclo_dias INT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipo),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA DE LOTES
CREATE TABLE IF NOT EXISTS lotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  area_hectareas DECIMAL(10,2) NOT NULL,
  perimetro_metros DECIMAL(10,2),
  altitud_msnm INT,
  cultivo_id INT,
  estado ENUM('EN_CRECIMIENTO', 'EN_COSECHA', 'EN_MANTENIMIENTO', 'INACTIVO') DEFAULT 'EN_CRECIMIENTO',
  tipo_suelo ENUM('ARCILLOSO', 'ARENOSO', 'LIMOSO', 'FRANCO', 'HUMIFERO'),
  ph_suelo DECIMAL(3,1),
  topografia ENUM('PLANO', 'ONDULADO', 'MONTAÑOSO'),
  sistema_riego ENUM('GOTEO', 'ASPERSION', 'GRAVEDAD', 'NINGUNO'),
  tiene_cerca BOOLEAN DEFAULT FALSE,
  tiene_sombra BOOLEAN DEFAULT FALSE,
  acceso_vehicular BOOLEAN DEFAULT FALSE,
  notas TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_ultima_actividad TIMESTAMP,
  proxima_actividad VARCHAR(255),
  FOREIGN KEY (cultivo_id) REFERENCES cultivos(id) ON DELETE SET NULL,
  INDEX idx_codigo (codigo),
  INDEX idx_estado (estado),
  INDEX idx_cultivo (cultivo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA DE COORDENADAS DE LOTES
CREATE TABLE IF NOT EXISTS lote_coordenadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lote_id INT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  orden INT NOT NULL,
  FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE,
  INDEX idx_lote (lote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA DE ACTIVIDADES PLANIFICADAS
CREATE TABLE IF NOT EXISTS actividades_planificadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  tipo ENUM('SIEMBRA', 'RIEGO', 'FUMIGACION', 'FERTILIZACION', 'COSECHA', 'MANTENIMIENTO', 'PODA', 'CONTROL_PLAGAS', 'OTRO') NOT NULL,
  prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL,
  estado ENUM('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'ATRASADA', 'CANCELADA') DEFAULT 'PENDIENTE',
  fecha_inicio_planificada DATE NOT NULL,
  fecha_fin_planificada DATE NOT NULL,
  duracion_estimada_horas INT NOT NULL,
  periodo ENUM('DIA', 'SEMANA', 'QUINCENAL', 'MES') NOT NULL,
  fecha_inicio_real DATE,
  fecha_fin_real DATE,
  duracion_real_horas INT,
  progreso_porcentaje INT DEFAULT 0,
  lote_id INT,
  cultivo_id INT,
  responsable_id INT,
  desviacion_tiempo_dias INT DEFAULT 0,
  requiere_atencion BOOLEAN DEFAULT FALSE,
  notas TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  creado_por INT,
  FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL,
  FOREIGN KEY (cultivo_id) REFERENCES cultivos(id) ON DELETE SET NULL,
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_estado (estado),
  INDEX idx_lote (lote_id),
  INDEX idx_tipo (tipo),
  INDEX idx_fechas (fecha_inicio_planificada, fecha_fin_planificada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA DE TRABAJADORES ASIGNADOS A ACTIVIDADES
CREATE TABLE IF NOT EXISTS actividad_trabajadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actividad_id INT NOT NULL,
  trabajador_id INT NOT NULL,
  horas_trabajadas DECIMAL(5,2) DEFAULT 0,
  horas_planificadas DECIMAL(5,2) NOT NULL,
  eficiencia_porcentaje INT DEFAULT 0,
  tareas_completadas INT DEFAULT 0,
  tareas_asignadas INT DEFAULT 0,
  FOREIGN KEY (actividad_id) REFERENCES actividades_planificadas(id) ON DELETE CASCADE,
  FOREIGN KEY (trabajador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_actividad (actividad_id),
  INDEX idx_trabajador (trabajador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABLA DE METAS DE ACTIVIDADES
CREATE TABLE IF NOT EXISTS actividad_metas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actividad_id INT NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  valor_objetivo DECIMAL(10,2) NOT NULL,
  valor_actual DECIMAL(10,2) DEFAULT 0,
  unidad VARCHAR(50) NOT NULL,
  cumplida BOOLEAN DEFAULT FALSE,
  porcentaje_cumplimiento INT DEFAULT 0,
  fecha_cumplimiento DATE,
  FOREIGN KEY (actividad_id) REFERENCES actividades_planificadas(id) ON DELETE CASCADE,
  INDEX idx_actividad (actividad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABLA DE ALERTAS
CREATE TABLE IF NOT EXISTS alertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actividad_id INT NOT NULL,
  tipo ENUM('RETRASO', 'BAJO_RENDIMIENTO', 'ACTIVIDAD_VENCIDA', 'DESVIACION_TIEMPO', 'DESVIACION_RECURSOS', 'CLIMA_ADVERSO', 'FALTA_RECURSOS') NOT NULL,
  severidad ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leida BOOLEAN DEFAULT FALSE,
  resuelta BOOLEAN DEFAULT FALSE,
  fecha_resolucion TIMESTAMP,
  FOREIGN KEY (actividad_id) REFERENCES actividades_planificadas(id) ON DELETE CASCADE,
  INDEX idx_actividad (actividad_id),
  INDEX idx_severidad (severidad),
  INDEX idx_leida (leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABLA DE TRABAJADORES
CREATE TABLE IF NOT EXISTS trabajadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(255) NOT NULL,
  apellidos VARCHAR(255) NOT NULL,
  documento VARCHAR(50) UNIQUE NOT NULL,
  tipo_documento ENUM('DNI', 'Pasaporte', 'Cédula', 'Otro') NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(255) UNIQUE,
  cargo VARCHAR(100),
  fecha_ingreso DATE NOT NULL,
  estado ENUM('activo', 'inactivo', 'vacaciones', 'licencia') DEFAULT 'activo',
  direccion TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_documento (documento),
  INDEX idx_email (email),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABLA DE TIPOS DE LABOR
CREATE TABLE IF NOT EXISTS tipos_labor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria ENUM('SIEMBRA', 'CUIDADO', 'COSECHA', 'MANTENIMIENTO', 'OTRO') NOT NULL,
  unidad_medida ENUM('kg', 'litros', 'unidades', 'toneladas', 'quintales') NOT NULL,
  costo_por_hora DECIMAL(10,2),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_categoria (categoria),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABLA DE LABORES AGRÍCOLAS
CREATE TABLE IF NOT EXISTS labores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  cultivo VARCHAR(255) NOT NULL,
  lote VARCHAR(255) NOT NULL,
  trabajador_id INT NOT NULL,
  tipo_labor_id INT NOT NULL,
  cantidad_recolectada DECIMAL(10,2) NOT NULL,
  unidad_medida ENUM('kg', 'litros', 'unidades', 'toneladas', 'quintales') NOT NULL,
  peso_total DECIMAL(10,2) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  ubicacion_gps JSON NOT NULL,
  condiciones_climaticas JSON,
  herramientas_insumos JSON,
  observaciones TEXT,
  fotos JSON,
  duracion_minutos INT,
  rendimiento_por_hora DECIMAL(10,2),
  costo_estimado DECIMAL(10,2),
  estado ENUM('en_proceso', 'completada', 'pausada', 'cancelada') DEFAULT 'completada',
  supervisor_id INT,
  actividad_planificada_id INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_labor_id) REFERENCES tipos_labor(id) ON DELETE CASCADE,
  FOREIGN KEY (supervisor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (actividad_planificada_id) REFERENCES actividades_planificadas(id) ON DELETE SET NULL,
  INDEX idx_fecha (fecha),
  INDEX idx_trabajador (trabajador_id),
  INDEX idx_tipo_labor (tipo_labor_id),
  INDEX idx_estado (estado),
  INDEX idx_actividad_planificada (actividad_planificada_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================================================

-- Insertar cultivos de ejemplo
INSERT INTO cultivos (nombre, nombre_cientifico, tipo, ciclo_dias, descripcion) VALUES
('Café', 'Coffea arabica', 'Otro', 1825, 'Café arábigo de alta calidad para exportación'),
('Banano', 'Musa paradisiaca', 'Fruta', 365, 'Banano tipo exportación'),
('Maíz', 'Zea mays', 'Cereal', 120, 'Maíz amarillo para consumo'),
('Papa', 'Solanum tuberosum', 'Tubérculo', 150, 'Papa criolla'),
('Tomate', 'Solanum lycopersicum', 'Hortaliza', 90, 'Tomate chonto para mesa')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- Insertar trabajadores de ejemplo
INSERT INTO trabajadores (nombres, apellidos, documento, tipo_documento, telefono, email, cargo, fecha_ingreso, estado, direccion) VALUES
('Juan', 'Pérez', '12345678', 'DNI', '987654321', 'juan.perez@empresa.com', 'Operario de Campo', '2023-01-15', 'activo', 'Calle Principal 123'),
('María', 'García', '87654321', 'DNI', '987654322', 'maria.garcia@empresa.com', 'Supervisora', '2022-06-10', 'activo', 'Avenida Central 456'),
('Carlos', 'López', '11223344', 'DNI', '987654323', 'carlos.lopez@empresa.com', 'Operario de Campo', '2023-03-20', 'activo', 'Calle Secundaria 789'),
('Ana', 'Martínez', '44332211', 'DNI', '987654324', 'ana.martinez@empresa.com', 'Operario de Campo', '2023-02-01', 'vacaciones', 'Calle Norte 321'),
('Pedro', 'Rodríguez', '55667788', 'DNI', '987654325', 'pedro.rodriguez@empresa.com', 'Operario de Campo', '2022-11-15', 'activo', 'Calle Sur 654')
ON DUPLICATE KEY UPDATE nombres = nombres;

-- Insertar tipos de labor de ejemplo
INSERT INTO tipos_labor (nombre, descripcion, categoria, unidad_medida, costo_por_hora, activo) VALUES
('Siembra Manual', 'Plantación manual de semillas o plántulas', 'SIEMBRA', 'unidades', 15.00, TRUE),
('Riego por Goteo', 'Aplicación de agua mediante sistema de goteo', 'CUIDADO', 'litros', 12.00, TRUE),
('Fumigación', 'Aplicación de pesticidas y fungicidas', 'CUIDADO', 'litros', 20.00, TRUE),
('Fertilización', 'Aplicación de fertilizantes orgánicos e inorgánicos', 'CUIDADO', 'kg', 18.00, TRUE),
('Cosecha Manual', 'Recolección manual de productos agrícolas', 'COSECHA', 'kg', 16.00, TRUE),
('Poda', 'Corte y mantenimiento de plantas', 'MANTENIMIENTO', 'unidades', 14.00, TRUE),
('Deshierbe', 'Eliminación manual de malezas', 'MANTENIMIENTO', 'm2', 10.00, TRUE),
('Control de Plagas', 'Inspección y control de plagas', 'CUIDADO', 'unidades', 22.00, TRUE)
ON DUPLICATE KEY UPDATE nombre = nombre;

