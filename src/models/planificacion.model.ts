import { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/database'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export enum TipoActividad {
  SIEMBRA = 'SIEMBRA',
  RIEGO = 'RIEGO',
  FUMIGACION = 'FUMIGACION',
  FERTILIZACION = 'FERTILIZACION',
  COSECHA = 'COSECHA',
  MANTENIMIENTO = 'MANTENIMIENTO',
  PODA = 'PODA',
  CONTROL_PLAGAS = 'CONTROL_PLAGAS',
  OTRO = 'OTRO'
}

export enum NivelPrioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE'
}

export enum EstadoActividad {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  ATRASADA = 'ATRASADA',
  CANCELADA = 'CANCELADA'
}

export enum PeriodoTiempo {
  DIA = 'DIA',
  SEMANA = 'SEMANA',
  QUINCENAL = 'QUINCENAL',
  MES = 'MES'
}

export enum TipoAlerta {
  RETRASO = 'RETRASO',
  BAJO_RENDIMIENTO = 'BAJO_RENDIMIENTO',
  ACTIVIDAD_VENCIDA = 'ACTIVIDAD_VENCIDA',
  DESVIACION_TIEMPO = 'DESVIACION_TIEMPO',
  DESVIACION_RECURSOS = 'DESVIACION_RECURSOS',
  CLIMA_ADVERSO = 'CLIMA_ADVERSO',
  FALTA_RECURSOS = 'FALTA_RECURSOS'
}

export interface ActividadPlanificada extends RowDataPacket {
  id: number
  nombre: string
  descripcion: string
  tipo: TipoActividad
  prioridad: NivelPrioridad
  estado: EstadoActividad
  fecha_inicio_planificada: Date
  fecha_fin_planificada: Date
  duracion_estimada_horas: number
  periodo: PeriodoTiempo
  fecha_inicio_real?: Date
  fecha_fin_real?: Date
  duracion_real_horas?: number
  progreso_porcentaje: number
  lote_id?: number
  lote_nombre?: string
  cultivo_id?: number
  cultivo_nombre?: string
  responsable_id?: number
  responsable_nombre?: string
  desviacion_tiempo_dias: number
  requiere_atencion: boolean
  notas?: string
  fecha_creacion: Date
  ultima_actualizacion: Date
  creado_por?: number
  trabajadores_asignados?: string[]
  trabajadores_nombres?: string[]
  metas?: MetaActividad[]
  alertas_activas?: Alerta[]
}

export interface MetaActividad extends RowDataPacket {
  id: number
  actividad_id: number
  descripcion: string
  valor_objetivo: number
  valor_actual: number
  unidad: string
  cumplida: boolean
  porcentaje_cumplimiento: number
  fecha_cumplimiento?: Date
}

export interface Alerta extends RowDataPacket {
  id: number
  actividad_id: number
  tipo: TipoAlerta
  severidad: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  titulo: string
  mensaje: string
  fecha_generacion: Date
  leida: boolean
  resuelta: boolean
  fecha_resolucion?: Date
}

export interface CreateActividadDto {
  nombre: string
  descripcion: string
  tipo: TipoActividad
  prioridad: NivelPrioridad
  fecha_inicio_planificada: Date
  fecha_fin_planificada: Date
  duracion_estimada_horas: number
  periodo: PeriodoTiempo
  lote_id?: number
  cultivo_id?: number
  responsable_id?: number
  notas?: string
  trabajadores_asignados?: number[]
  metas?: Omit<MetaActividad, 'id' | 'actividad_id'>[]
}

export interface UpdateActividadDto {
  nombre?: string
  descripcion?: string
  tipo?: TipoActividad
  prioridad?: NivelPrioridad
  estado?: EstadoActividad
  fecha_inicio_planificada?: Date
  fecha_fin_planificada?: Date
  duracion_estimada_horas?: number
  fecha_inicio_real?: Date
  fecha_fin_real?: Date
  duracion_real_horas?: number
  progreso_porcentaje?: number
  lote_id?: number
  cultivo_id?: number
  responsable_id?: number
  notas?: string
  trabajadores_asignados?: number[]
  metas?: Omit<MetaActividad, 'id' | 'actividad_id'>[]
}

// ============================================================================
// MODELO
// ============================================================================

export class PlanificacionModel {
  /**
   * Obtener todas las actividades con relaciones
   */
  static async findAll(): Promise<ActividadPlanificada[]> {
    const [actividades] = await pool.execute<ActividadPlanificada[]>(`
      SELECT 
        a.*,
        l.nombre as lote_nombre,
        c.nombre as cultivo_nombre,
        u.nombre as responsable_nombre
      FROM actividades_planificadas a
      LEFT JOIN lotes l ON a.lote_id = l.id
      LEFT JOIN cultivos c ON a.cultivo_id = c.id
      LEFT JOIN usuarios u ON a.responsable_id = u.id
      ORDER BY a.fecha_inicio_planificada DESC
    `)

    // Cargar trabajadores, metas y alertas para cada actividad
    for (const actividad of actividades) {
      actividad.trabajadores_asignados = await this.getTrabajadoresIds(actividad.id)
      actividad.trabajadores_nombres = await this.getTrabajadoresNombres(actividad.id)
      actividad.metas = await this.getMetas(actividad.id)
      actividad.alertas_activas = await this.getAlertas(actividad.id)
    }

    return actividades
  }

  /**
   * Obtener una actividad por ID
   */
  static async findById(id: number): Promise<ActividadPlanificada | null> {
    const [rows] = await pool.execute<ActividadPlanificada[]>(`
      SELECT 
        a.*,
        l.nombre as lote_nombre,
        c.nombre as cultivo_nombre,
        u.nombre as responsable_nombre
      FROM actividades_planificadas a
      LEFT JOIN lotes l ON a.lote_id = l.id
      LEFT JOIN cultivos c ON a.cultivo_id = c.id
      LEFT JOIN usuarios u ON a.responsable_id = u.id
      WHERE a.id = ?
    `, [id])

    if (rows.length === 0) return null

    const actividad = rows[0]
    actividad.trabajadores_asignados = await this.getTrabajadoresIds(id)
    actividad.trabajadores_nombres = await this.getTrabajadoresNombres(id)
    actividad.metas = await this.getMetas(id)
    actividad.alertas_activas = await this.getAlertas(id)

    return actividad
  }

  /**
   * Obtener IDs de trabajadores asignados
   */
  static async getTrabajadoresIds(actividadId: number): Promise<string[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT trabajador_id FROM actividad_trabajadores WHERE actividad_id = ?',
      [actividadId]
    )
    return rows.map(r => r.trabajador_id.toString())
  }

  /**
   * Obtener nombres de trabajadores asignados
   */
  static async getTrabajadoresNombres(actividadId: number): Promise<string[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT CONCAT(t.nombres, ' ', t.apellidos) as nombre
      FROM actividad_trabajadores at
      JOIN trabajadores t ON at.trabajador_id = t.id
      WHERE at.actividad_id = ?
    `, [actividadId])
    return rows.map(r => r.nombre)
  }

  /**
   * Obtener metas de una actividad
   */
  static async getMetas(actividadId: number): Promise<MetaActividad[]> {
    const [rows] = await pool.execute<MetaActividad[]>(
      'SELECT * FROM actividad_metas WHERE actividad_id = ?',
      [actividadId]
    )
    return rows
  }

  /**
   * Obtener alertas activas de una actividad
   */
  static async getAlertas(actividadId: number): Promise<Alerta[]> {
    const [rows] = await pool.execute<Alerta[]>(
      'SELECT * FROM alertas WHERE actividad_id = ? AND resuelta = FALSE ORDER BY fecha_generacion DESC',
      [actividadId]
    )
    return rows
  }

  /**
   * Crear una actividad
   */
  static async create(data: CreateActividadDto, userId: number | null): Promise<number> {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      // Insertar actividad
      const [result] = await connection.execute<ResultSetHeader>(`
        INSERT INTO actividades_planificadas (
          nombre, descripcion, tipo, prioridad, fecha_inicio_planificada,
          fecha_fin_planificada, duracion_estimada_horas, periodo,
          lote_id, cultivo_id, responsable_id, notas, creado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.nombre,
        data.descripcion,
        data.tipo,
        data.prioridad,
        data.fecha_inicio_planificada,
        data.fecha_fin_planificada,
        data.duracion_estimada_horas,
        data.periodo,
        data.lote_id || null,
        data.cultivo_id || null,
        data.responsable_id || null,
        data.notas || null,
        userId
      ])

      const actividadId = result.insertId

      // Insertar trabajadores
      if (data.trabajadores_asignados && data.trabajadores_asignados.length > 0) {
        for (const trabajadorId of data.trabajadores_asignados) {
          await connection.execute(`
            INSERT INTO actividad_trabajadores (actividad_id, trabajador_id, horas_planificadas)
            VALUES (?, ?, ?)
          `, [actividadId, trabajadorId, data.duracion_estimada_horas / data.trabajadores_asignados.length])
        }
      }

      // Insertar metas
      if (data.metas && data.metas.length > 0) {
        for (const meta of data.metas) {
          await connection.execute(`
            INSERT INTO actividad_metas (actividad_id, descripcion, valor_objetivo, unidad)
            VALUES (?, ?, ?, ?)
          `, [actividadId, meta.descripcion, meta.valor_objetivo, meta.unidad])
        }
      }

      await connection.commit()
      return actividadId
      
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  /**
   * Actualizar una actividad
   */
  static async update(id: number, data: UpdateActividadDto): Promise<boolean> {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      const fields: string[] = []
      const values: any[] = []

      if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre) }
      if (data.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(data.descripcion) }
      if (data.tipo !== undefined) { fields.push('tipo = ?'); values.push(data.tipo) }
      if (data.prioridad !== undefined) { fields.push('prioridad = ?'); values.push(data.prioridad) }
      if (data.estado !== undefined) { fields.push('estado = ?'); values.push(data.estado) }
      if (data.fecha_inicio_planificada !== undefined) { fields.push('fecha_inicio_planificada = ?'); values.push(data.fecha_inicio_planificada) }
      if (data.fecha_fin_planificada !== undefined) { fields.push('fecha_fin_planificada = ?'); values.push(data.fecha_fin_planificada) }
      if (data.duracion_estimada_horas !== undefined) { fields.push('duracion_estimada_horas = ?'); values.push(data.duracion_estimada_horas) }
      if (data.fecha_inicio_real !== undefined) { fields.push('fecha_inicio_real = ?'); values.push(data.fecha_inicio_real) }
      if (data.fecha_fin_real !== undefined) { fields.push('fecha_fin_real = ?'); values.push(data.fecha_fin_real) }
      if (data.duracion_real_horas !== undefined) { fields.push('duracion_real_horas = ?'); values.push(data.duracion_real_horas) }
      if (data.progreso_porcentaje !== undefined) { fields.push('progreso_porcentaje = ?'); values.push(data.progreso_porcentaje) }
      if (data.lote_id !== undefined) { fields.push('lote_id = ?'); values.push(data.lote_id) }
      if (data.cultivo_id !== undefined) { fields.push('cultivo_id = ?'); values.push(data.cultivo_id) }
      if (data.responsable_id !== undefined) { fields.push('responsable_id = ?'); values.push(data.responsable_id) }
      if (data.notas !== undefined) { fields.push('notas = ?'); values.push(data.notas) }

      if (fields.length > 0) {
        values.push(id)
        const [result] = await connection.execute<ResultSetHeader>(
          `UPDATE actividades_planificadas SET ${fields.join(', ')} WHERE id = ?`,
          values
        )

        if (result.affectedRows === 0) {
          await connection.rollback()
          return false
        }
      }

      // Actualizar trabajadores si se proporcionan
      if (data.trabajadores_asignados !== undefined) {
        await connection.execute('DELETE FROM actividad_trabajadores WHERE actividad_id = ?', [id])
        
        if (data.trabajadores_asignados.length > 0) {
          const duracion = data.duracion_estimada_horas || 0
          for (const trabajadorId of data.trabajadores_asignados) {
            await connection.execute(`
              INSERT INTO actividad_trabajadores (actividad_id, trabajador_id, horas_planificadas)
              VALUES (?, ?, ?)
            `, [id, trabajadorId, duracion / data.trabajadores_asignados.length])
          }
        }
      }

      // Actualizar metas si se proporcionan
      if (data.metas !== undefined) {
        await connection.execute('DELETE FROM actividad_metas WHERE actividad_id = ?', [id])
        
        if (data.metas.length > 0) {
          for (const meta of data.metas) {
            await connection.execute(`
              INSERT INTO actividad_metas (actividad_id, descripcion, valor_objetivo, unidad)
              VALUES (?, ?, ?, ?)
            `, [id, meta.descripcion, meta.valor_objetivo, meta.unidad])
          }
        }
      }

      await connection.commit()
      return true
      
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  /**
   * Eliminar una actividad
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM actividades_planificadas WHERE id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  /**
   * Verificar si existe
   */
  static async exists(id: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM actividades_planificadas WHERE id = ?',
      [id]
    )
    return rows[0].count > 0
  }

  /**
   * Obtener estadísticas
   */
  static async getEstadisticas(): Promise<any> {
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_actividades,
        COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'EN_PROGRESO' THEN 1 END) as en_progreso,
        COUNT(CASE WHEN estado = 'COMPLETADA' THEN 1 END) as completadas,
        COUNT(CASE WHEN estado = 'ATRASADA' THEN 1 END) as atrasadas,
        AVG(progreso_porcentaje) as progreso_promedio,
        COUNT(CASE WHEN requiere_atencion = TRUE THEN 1 END) as requieren_atencion
      FROM actividades_planificadas
    `)
    
    return stats[0]
  }

  /**
   * Obtener actividades de un lote
   */
  static async findByLote(loteId: number): Promise<ActividadPlanificada[]> {
    const [actividades] = await pool.execute<ActividadPlanificada[]>(`
      SELECT 
        a.*,
        l.nombre as lote_nombre,
        c.nombre as cultivo_nombre,
        u.nombre as responsable_nombre
      FROM actividades_planificadas a
      LEFT JOIN lotes l ON a.lote_id = l.id
      LEFT JOIN cultivos c ON a.cultivo_id = c.id
      LEFT JOIN usuarios u ON a.responsable_id = u.id
      WHERE a.lote_id = ?
      ORDER BY a.fecha_inicio_planificada DESC
    `, [loteId])

    for (const actividad of actividades) {
      actividad.trabajadores_asignados = await this.getTrabajadoresIds(actividad.id)
      actividad.trabajadores_nombres = await this.getTrabajadoresNombres(actividad.id)
      actividad.metas = await this.getMetas(actividad.id)
      actividad.alertas_activas = await this.getAlertas(actividad.id)
    }

    return actividades
  }
}

