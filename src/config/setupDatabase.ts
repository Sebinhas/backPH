import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  let pool: Pool | null = null;
  
  try {
    console.log('📦 Iniciando configuración de base de datos PostgreSQL...');
    console.log(`🔗 Conectando a: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);

    // Si estamos usando Railway o una BD remota, conectamos directamente
    if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
      console.log('🌐 Detectada configuración de base de datos remota (Railway)');
      
      pool = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    } else {
      // Configuración local - crear BD si no existe
      const adminPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: 'postgres' // Conectar a la BD por defecto
      });

      // Crear base de datos si no existe
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'sistema_agricola'}`);
      console.log(`✅ Base de datos '${process.env.DB_NAME}' creada/verificada`);

      await adminPool.end();

      // Conectar a la nueva base de datos
      pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sistema_agricola'
      });
    }

    // Crear tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(255) NOT NULL,
        avatar VARCHAR(500),
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla usuarios creada/verificada');

    // Crear tabla de roles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla roles creada/verificada');

    // Crear tabla de tokens (opcional, para blacklist de tokens)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token VARCHAR(500) NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla token_blacklist creada/verificada');

    // Crear tabla de cultivos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cultivos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        nombre_cientifico VARCHAR(255),
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Hortaliza', 'Fruta', 'Cereal', 'Leguminosa', 'Tubérculo', 'Flor', 'Otro')),
        ciclo_dias INTEGER NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla cultivos creada/verificada');

    // Insertar datos de ejemplo de cultivos
    await pool.query(`
      INSERT INTO cultivos (id, nombre, nombre_cientifico, tipo, ciclo_dias, descripcion) VALUES
      (1, 'Café', 'Coffea arabica', 'Otro', 1825, 'Café arábigo de alta calidad para exportación'),
      (2, 'Banano', 'Musa paradisiaca', 'Fruta', 365, 'Banano tipo exportación'),
      (3, 'Maíz', 'Zea mays', 'Cereal', 120, 'Maíz amarillo para consumo'),
      (4, 'Papa', 'Solanum tuberosum', 'Tubérculo', 150, 'Papa criolla'),
      (5, 'Tomate', 'Solanum lycopersicum', 'Hortaliza', 90, 'Tomate chonto para mesa')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Datos de ejemplo de cultivos insertados');

    // Crear tabla de lotes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lotes (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        area_hectareas DECIMAL(10,2) NOT NULL,
        perimetro_metros DECIMAL(10,2),
        altitud_msnm INTEGER,
        cultivo_id INTEGER,
        estado VARCHAR(50) DEFAULT 'EN_CRECIMIENTO' CHECK (estado IN ('EN_CRECIMIENTO', 'EN_COSECHA', 'EN_MANTENIMIENTO', 'INACTIVO')),
        tipo_suelo VARCHAR(50) CHECK (tipo_suelo IN ('ARCILLOSO', 'ARENOSO', 'LIMOSO', 'FRANCO', 'HUMIFERO')),
        ph_suelo DECIMAL(3,1),
        topografia VARCHAR(50) CHECK (topografia IN ('PLANO', 'ONDULADO', 'MONTAÑOSO')),
        sistema_riego VARCHAR(50) CHECK (sistema_riego IN ('GOTEO', 'ASPERSION', 'GRAVEDAD', 'NINGUNO')),
        tiene_cerca BOOLEAN DEFAULT FALSE,
        tiene_sombra BOOLEAN DEFAULT FALSE,
        acceso_vehicular BOOLEAN DEFAULT FALSE,
        notas TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_ultima_actividad TIMESTAMP,
        proxima_actividad VARCHAR(255),
        FOREIGN KEY (cultivo_id) REFERENCES cultivos(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabla lotes creada/verificada');

    // Crear tabla de coordenadas de lotes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lote_coordenadas (
        id SERIAL PRIMARY KEY,
        lote_id INTEGER NOT NULL,
        latitud DECIMAL(10, 8) NOT NULL,
        longitud DECIMAL(11, 8) NOT NULL,
        orden INTEGER NOT NULL,
        FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla lote_coordenadas creada/verificada');

    // Crear tabla de actividades planificadas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS actividades_planificadas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('SIEMBRA', 'RIEGO', 'FUMIGACION', 'FERTILIZACION', 'COSECHA', 'MANTENIMIENTO', 'PODA', 'CONTROL_PLAGAS', 'OTRO')),
        prioridad VARCHAR(50) DEFAULT 'MEDIA' CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'URGENTE')),
        estado VARCHAR(50) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'ATRASADA', 'CANCELADA')),
        fecha_inicio_planificada TIMESTAMP NOT NULL,
        fecha_fin_planificada TIMESTAMP NOT NULL,
        duracion_estimada_horas DECIMAL(8,2) NOT NULL,
        periodo VARCHAR(50) NOT NULL CHECK (periodo IN ('DIA', 'SEMANA', 'QUINCENAL', 'MES')),
        fecha_inicio_real TIMESTAMP,
        fecha_fin_real TIMESTAMP,
        duracion_real_horas DECIMAL(8,2),
        progreso_porcentaje INTEGER DEFAULT 0,
        lote_id INTEGER,
        cultivo_id INTEGER,
        responsable_id INTEGER,
        desviacion_tiempo_dias INTEGER DEFAULT 0,
        requiere_atencion BOOLEAN DEFAULT FALSE,
        notas TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        creado_por INTEGER,
        FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL,
        FOREIGN KEY (cultivo_id) REFERENCES cultivos(id) ON DELETE SET NULL,
        FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabla actividades_planificadas creada/verificada');

    // Crear tabla de trabajadores asignados a actividades
    await pool.query(`
      CREATE TABLE IF NOT EXISTS actividad_trabajadores (
        id SERIAL PRIMARY KEY,
        actividad_id INTEGER NOT NULL,
        trabajador_id INTEGER NOT NULL,
        horas_planificadas DECIMAL(8,2) DEFAULT 0,
        horas_reales DECIMAL(8,2) DEFAULT 0,
        FOREIGN KEY (actividad_id) REFERENCES actividades_planificadas(id) ON DELETE CASCADE,
        FOREIGN KEY (trabajador_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla actividad_trabajadores creada/verificada');

    // Crear tabla de metas de actividades
    await pool.query(`
      CREATE TABLE IF NOT EXISTS actividad_metas (
        id SERIAL PRIMARY KEY,
        actividad_id INTEGER NOT NULL,
        descripcion VARCHAR(255) NOT NULL,
        valor_objetivo DECIMAL(10,2) NOT NULL,
        valor_actual DECIMAL(10,2) DEFAULT 0,
        unidad VARCHAR(50) NOT NULL,
        cumplida BOOLEAN DEFAULT FALSE,
        porcentaje_cumplimiento INTEGER DEFAULT 0,
        fecha_cumplimiento TIMESTAMP,
        FOREIGN KEY (actividad_id) REFERENCES actividades_planificadas(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla actividad_metas creada/verificada');

    // Crear tabla de alertas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alertas (
        id SERIAL PRIMARY KEY,
        actividad_id INTEGER NOT NULL,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('RETRASO', 'BAJO_RENDIMIENTO', 'ACTIVIDAD_VENCIDA', 'DESVIACION_TIEMPO', 'DESVIACION_RECURSOS', 'CLIMA_ADVERSO', 'FALTA_RECURSOS')),
        severidad VARCHAR(50) DEFAULT 'INFO' CHECK (severidad IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
        titulo VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        leida BOOLEAN DEFAULT FALSE,
        resuelta BOOLEAN DEFAULT FALSE,
        fecha_resolucion TIMESTAMP,
        FOREIGN KEY (actividad_id) REFERENCES actividades_planificadas(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla alertas creada/verificada');

    // Crear tabla de trabajadores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trabajadores (
        id SERIAL PRIMARY KEY,
        nombres VARCHAR(255) NOT NULL,
        apellidos VARCHAR(255) NOT NULL,
        documento VARCHAR(50) UNIQUE NOT NULL,
        tipo_documento VARCHAR(50) NOT NULL CHECK (tipo_documento IN ('DNI', 'Pasaporte', 'Cédula', 'Otro')),
        telefono VARCHAR(20) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        cargo VARCHAR(255) NOT NULL,
        fecha_ingreso DATE NOT NULL,
        estado VARCHAR(50) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'vacaciones', 'licencia')),
        direccion TEXT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla trabajadores creada/verificada');

    // Insertar datos de ejemplo de trabajadores
    await pool.query(`
      INSERT INTO trabajadores (id, nombres, apellidos, documento, tipo_documento, telefono, email, cargo, fecha_ingreso, direccion) VALUES
      (1, 'Juan Carlos', 'Pérez González', '12345678A', 'DNI', '+34 600 123 456', 'juan.perez@empresa.com', 'Desarrollador Senior', '2022-01-15', 'Calle Mayor 123, 28013 Madrid, España'),
      (2, 'María Isabel', 'García Martínez', '87654321B', 'DNI', '+34 600 234 567', 'maria.garcia@empresa.com', 'Diseñadora UX/UI', '2024-10-17', 'Avenida de la Constitución 45, 41001 Sevilla, España'),
      (3, 'Carlos Alberto', 'López Rodríguez', '11223344C', 'DNI', '+34 600 345 678', 'carlos.lopez@empresa.com', 'Supervisor de Campo', '2023-03-10', 'Plaza España 78, 50001 Zaragoza, España'),
      (4, 'Ana Patricia', 'Martín Sánchez', '55667788D', 'DNI', '+34 600 456 789', 'ana.martin@empresa.com', 'Especialista en Cultivos', '2023-06-20', 'Calle Real 156, 29001 Málaga, España')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Datos de ejemplo de trabajadores insertados');

    // Crear tabla de tipos de labor
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_labor (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE NOT NULL,
        descripcion TEXT,
        categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('siembra', 'cosecha', 'riego', 'fertilizacion', 'control_plagas', 'mantenimiento', 'otro')),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla tipos_labor creada/verificada');

    // Insertar datos de ejemplo de tipos de labor
    await pool.query(`
      INSERT INTO tipos_labor (id, nombre, descripcion, categoria) VALUES
      (1, 'Preparación de Terreno', 'Arado, nivelación y preparación del suelo para siembra', 'siembra'),
      (2, 'Siembra Directa', 'Plantación de semillas directamente en el suelo', 'siembra'),
      (3, 'Riego por Goteo', 'Sistema de irrigación localizada de alta eficiencia', 'riego'),
      (4, 'Fertilización Orgánica', 'Aplicación de abonos naturales y compost', 'fertilizacion'),
      (5, 'Control de Plagas', 'Aplicación de pesticidas y manejo integrado', 'control_plagas'),
      (6, 'Cosecha Mecanizada', 'Recolección de cultivos usando maquinaria especializada', 'cosecha'),
      (7, 'Poda de Mantenimiento', 'Corte y formación de plantas para optimizar crecimiento', 'mantenimiento'),
      (8, 'Monitoreo de Cultivos', 'Inspección y evaluación del estado de los cultivos', 'mantenimiento')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Datos de ejemplo de tipos de labor insertados');

    // Crear tabla de labores agrícolas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS labores (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        cultivo VARCHAR(255) NOT NULL,
        lote VARCHAR(255) NOT NULL,
        trabajador_id INTEGER NOT NULL,
        tipo_labor_id INTEGER NOT NULL,
        cantidad_recolectada DECIMAL(10,2) NOT NULL,
        unidad_medida VARCHAR(50) NOT NULL CHECK (unidad_medida IN ('kg', 'litros', 'unidades', 'toneladas', 'quintales')),
        peso_total DECIMAL(10,2) NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        ubicacion_gps JSONB NOT NULL,
        condiciones_climaticas JSONB,
        herramientas_insumos JSONB,
        observaciones TEXT,
        fotos JSONB,
        duracion_minutos INTEGER,
        rendimiento_por_hora DECIMAL(8,2),
        costo_estimado DECIMAL(10,2),
        estado VARCHAR(50) DEFAULT 'completada' CHECK (estado IN ('en_proceso', 'completada', 'pausada', 'cancelada')),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        supervisor_id INTEGER,
        FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE,
        FOREIGN KEY (tipo_labor_id) REFERENCES tipos_labor(id) ON DELETE CASCADE,
        FOREIGN KEY (supervisor_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabla labores creada/verificada');

    // Insertar datos de ejemplo de labores
    await pool.query(`
      INSERT INTO labores (id, fecha, cultivo, lote, trabajador_id, tipo_labor_id, cantidad_recolectada, unidad_medida, peso_total, hora_inicio, hora_fin, ubicacion_gps, condiciones_climaticas, herramientas_insumos, observaciones, duracion_minutos, rendimiento_por_hora, costo_estimado) VALUES
      (1, '2024-10-15', 'Maíz', 'Lote A-1', 1, 2, 150.00, 'kg', 150.00, '08:00:00', '14:00:00', '{"latitud": -12.0464, "longitud": -77.0428}', '{"temperatura": 24, "humedad": 65, "lluvia": false}', '["Sembradora mecánica", "Semillas certificadas", "Fertilizante NPK"]', 'Siembra realizada en condiciones óptimas. Suelo bien preparado.', 360, 25.00, 180.00),
      (2, '2024-10-16', 'Café', 'Lote B-2', 2, 6, 320.00, 'kg', 320.00, '06:00:00', '15:00:00', '{"latitud": -12.0501, "longitud": -77.0389}', '{"temperatura": 22, "humedad": 70, "lluvia": false}', '["Cosechadora selectiva", "Sacos de yute", "Balanza digital"]', 'Café cereza en punto óptimo de maduración.', 540, 35.50, 270.00),
      (3, '2024-10-17', 'Tomate', 'Lote C-3', 3, 3, 0.00, 'litros', 0.00, '07:00:00', '11:00:00', '{"latitud": -12.0488, "longitud": -77.0405}', '{"temperatura": 26, "humedad": 60, "lluvia": false}', '["Sistema de riego por goteo", "Fertilizante líquido"]', 'Riego programado para optimizar crecimiento.', 240, 0.00, 120.00),
      (4, '2024-10-18', 'Papa', 'Lote D-4', 4, 4, 0.00, 'kg', 0.00, '09:00:00', '13:00:00', '{"latitud": -12.0523, "longitud": -77.0367}', '{"temperatura": 23, "humedad": 68, "lluvia": true}', '["Fertilizante orgánico", "Aplicador manual"]', 'Fertilización realizada con lluvia ligera.', 240, 0.00, 90.00)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Datos de ejemplo de labores insertados');

    console.log('🎉 Base de datos PostgreSQL configurada exitosamente');
    
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default setupDatabase;