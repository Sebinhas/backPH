import pool from './database'

async function addActividadPlanificadaColumn() {
  try {
    console.log('🔧 Agregando columna actividad_planificada_id a la tabla labores...')
    
    // Verificar si la columna ya existe
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'temporal' 
      AND TABLE_NAME = 'labores' 
      AND COLUMN_NAME = 'actividad_planificada_id'
    `)
    
    if (Array.isArray(columns) && columns.length > 0) {
      console.log('✅ La columna actividad_planificada_id ya existe')
      return
    }
    
    // Agregar la columna
    await pool.execute(`
      ALTER TABLE labores 
      ADD COLUMN actividad_planificada_id INT NULL,
      ADD CONSTRAINT fk_labores_actividad_planificada 
      FOREIGN KEY (actividad_planificada_id) 
      REFERENCES actividades_planificadas(id) 
      ON DELETE SET NULL
    `)
    
    // Agregar índice
    await pool.execute(`
      CREATE INDEX idx_labores_actividad_planificada 
      ON labores(actividad_planificada_id)
    `)
    
    console.log('✅ Columna actividad_planificada_id agregada exitosamente')
    
  } catch (error) {
    console.error('❌ Error agregando columna:', error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addActividadPlanificadaColumn()
    .then(() => {
      console.log('🎉 Migración completada')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Error en migración:', error)
      process.exit(1)
    })
}

export default addActividadPlanificadaColumn
