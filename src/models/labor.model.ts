import { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/database'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export enum UnidadMedida {
  KG = 'kg',
  LITROS = 'litros',
  UNIDADES = 'unidades',
  TONELADAS = 'toneladas',
  QUINTALES = 'quintales'
}

export enum EstadoLabor {
  EN_PROCESO = 'en_proceso',
  COMPLETADA = 'completada',
  PAUSADA = 'pausada',
  CANCELADA = 'cancelada'
}

export interface CondicionesClimaticas {
  temperatura?: number
  humedad?: number
  lluvia?: boolean
}

export interface UbicacionGPS {
  latitud: number
  longitud: number
}

export interface Labor extends RowDataPacket {
  id: number
  fecha: string // YYYY-MM-DD
  cultivo: string
  lote: string
  trabajador_id: number
  trabajador_nombre: string
  tipo_labor_id: number
  tipo_labor_nombre: string
  cantidad_recolectada: number
  unidad_medida: UnidadMedida
  peso_total: number
  hora_inicio: string // HH:mm
  hora_fin: string // HH:mm
  ubicacion_gps: UbicacionGPS
  condiciones_climaticas?: CondicionesClimaticas
  herramientas_insumos?: string[]
  observaciones?: string
  fotos?: string[]
  duracion_minutos?: number
  rendimiento_por_hora?: number
  costo_estimado?: number
  estado: EstadoLabor
  fecha_creacion: Date
  ultima_modificacion?: Date
  supervisor_id?: number
  actividad_planificada_id?: number
}

export interface CreateLaborDto {
  fecha: string
  cultivo: string
  lote: string
  trabajador_id: number
  tipo_labor_id: number
  cantidad_recolectada: number
  unidad_medida: UnidadMedida
  peso_total: number
  hora_inicio: string
  hora_fin: string
  ubicacion_gps: UbicacionGPS
  condiciones_climaticas?: CondicionesClimaticas
  herramientas_insumos?: string[]
  observaciones?: string
  fotos?: string[]
  actividad_planificada_id?: number
}

export interface UpdateLaborDto {
  fecha?: string
  cultivo?: string
  lote?: string
  trabajador_id?: number
  tipo_labor_id?: number
  cantidad_recolectada?: number
  unidad_medida?: UnidadMedida
  peso_total?: number
  hora_inicio?: string
  hora_fin?: string
  ubicacion_gps?: UbicacionGPS
  condiciones_climaticas?: CondicionesClimaticas
  herramientas_insumos?: string[]
  observaciones?: string
  estado?: EstadoLabor
  actividad_planificada_id?: number
}

// ============================================================================
// MODELO
// ============================================================================

export class LaborModel {
  /**
   * Obtener todas las labores
   */
  static async findAll(): Promise<Labor[]> {
    const [rows] = await pool.execute<Labor[]>(
      `SELECT 
        l.*,
        CONCAT(t.nombres, ' ', t.apellidos) as trabajador_nombre,
        tl.nombre as tipo_labor_nombre
       FROM labores l
       LEFT JOIN trabajadores t ON l.trabajador_id = t.id
       LEFT JOIN tipos_labor tl ON l.tipo_labor_id = tl.id
       ORDER BY l.fecha DESC, l.fecha_creacion DESC`
    )
    return this.parseJsonFields(rows)
  }

  /**
   * Obtener una labor por ID
   */
  static async findById(id: number): Promise<Labor | null> {
    const [rows] = await pool.execute<Labor[]>(
      `SELECT 
        l.*,
        CONCAT(t.nombres, ' ', t.apellidos) as trabajador_nombre,
        tl.nombre as tipo_labor_nombre
       FROM labores l
       LEFT JOIN trabajadores t ON l.trabajador_id = t.id
       LEFT JOIN tipos_labor tl ON l.tipo_labor_id = tl.id
       WHERE l.id = ?`,
      [id]
    )
    
    if (!rows[0]) return null
    
    return this.parseJsonFields([rows[0]])[0]
  }

  /**
   * Buscar labores por query
   */
  static async search(query: string): Promise<Labor[]> {
    const searchTerm = `%${query}%`
    const [rows] = await pool.execute<Labor[]>(
      `SELECT 
        l.*,
        CONCAT(t.nombres, ' ', t.apellidos) as trabajador_nombre,
        tl.nombre as tipo_labor_nombre
       FROM labores l
       LEFT JOIN trabajadores t ON l.trabajador_id = t.id
       LEFT JOIN tipos_labor tl ON l.tipo_labor_id = tl.id
       WHERE l.cultivo LIKE ? 
       OR l.lote LIKE ? 
       OR CONCAT(t.nombres, ' ', t.apellidos) LIKE ?
       OR tl.nombre LIKE ?
       OR l.observaciones LIKE ?
       ORDER BY l.fecha DESC`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    )
    return this.parseJsonFields(rows)
  }

  /**
   * Obtener labores por rango de fechas
   */
  static async findByDateRange(fechaInicio: string, fechaFin: string): Promise<Labor[]> {
    const [rows] = await pool.execute<Labor[]>(
      `SELECT 
        l.*,
        CONCAT(t.nombres, ' ', t.apellidos) as trabajador_nombre,
        tl.nombre as tipo_labor_nombre
       FROM labores l
       LEFT JOIN trabajadores t ON l.trabajador_id = t.id
       LEFT JOIN tipos_labor tl ON l.tipo_labor_id = tl.id
       WHERE l.fecha BETWEEN ? AND ?
       ORDER BY l.fecha DESC`,
      [fechaInicio, fechaFin]
    )
    return this.parseJsonFields(rows)
  }

  /**
   * Obtener labores por trabajador
   */
  static async findByTrabajador(trabajadorId: number): Promise<Labor[]> {
    const [rows] = await pool.execute<Labor[]>(
      `SELECT 
        l.*,
        CONCAT(t.nombres, ' ', t.apellidos) as trabajador_nombre,
        tl.nombre as tipo_labor_nombre
       FROM labores l
       LEFT JOIN trabajadores t ON l.trabajador_id = t.id
       LEFT JOIN tipos_labor tl ON l.tipo_labor_id = tl.id
       WHERE l.trabajador_id = ?
       ORDER BY l.fecha DESC`,
      [trabajadorId]
    )
    return this.parseJsonFields(rows)
  }

  /**
   * Obtener estadísticas de labores
   */
  static async getEstadisticas() {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_labores,
        SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
        SUM(cantidad_recolectada) as total_recolectado,
        AVG(rendimiento_por_hora) as promedio_rendimiento,
        SUM(costo_estimado) as costo_total
       FROM labores`
    )
    return rows[0]
  }

  /**
   * Crear una nueva labor
   */
  static async create(data: CreateLaborDto, metricas: {duracionMinutos: number, rendimientoPorHora: number, costoEstimado: number}): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO labores 
       (fecha, cultivo, lote, trabajador_id, tipo_labor_id, cantidad_recolectada, 
        unidad_medida, peso_total, hora_inicio, hora_fin, ubicacion_gps, 
        condiciones_climaticas, herramientas_insumos, observaciones, fotos,
        duracion_minutos, rendimiento_por_hora, costo_estimado, estado, actividad_planificada_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.fecha,
        data.cultivo,
        data.lote,
        data.trabajador_id,
        data.tipo_labor_id,
        data.cantidad_recolectada,
        data.unidad_medida,
        data.peso_total,
        data.hora_inicio,
        data.hora_fin,
        JSON.stringify(data.ubicacion_gps),
        data.condiciones_climaticas ? JSON.stringify(data.condiciones_climaticas) : null,
        data.herramientas_insumos ? JSON.stringify(data.herramientas_insumos) : null,
        data.observaciones || null,
        data.fotos ? JSON.stringify(data.fotos) : null,
        metricas.duracionMinutos,
        metricas.rendimientoPorHora,
        metricas.costoEstimado,
        EstadoLabor.COMPLETADA,
        data.actividad_planificada_id || null
      ]
    )
    return result.insertId
  }

  /**
   * Actualizar una labor
   */
  static async update(id: number, data: UpdateLaborDto, metricas?: {duracionMinutos: number, rendimientoPorHora: number, costoEstimado: number}): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.fecha !== undefined) {
      fields.push('fecha = ?')
      values.push(data.fecha)
    }
    if (data.cultivo !== undefined) {
      fields.push('cultivo = ?')
      values.push(data.cultivo)
    }
    if (data.lote !== undefined) {
      fields.push('lote = ?')
      values.push(data.lote)
    }
    if (data.trabajador_id !== undefined) {
      fields.push('trabajador_id = ?')
      values.push(data.trabajador_id)
    }
    if (data.tipo_labor_id !== undefined) {
      fields.push('tipo_labor_id = ?')
      values.push(data.tipo_labor_id)
    }
    if (data.cantidad_recolectada !== undefined) {
      fields.push('cantidad_recolectada = ?')
      values.push(data.cantidad_recolectada)
    }
    if (data.unidad_medida !== undefined) {
      fields.push('unidad_medida = ?')
      values.push(data.unidad_medida)
    }
    if (data.peso_total !== undefined) {
      fields.push('peso_total = ?')
      values.push(data.peso_total)
    }
    if (data.hora_inicio !== undefined) {
      fields.push('hora_inicio = ?')
      values.push(data.hora_inicio)
    }
    if (data.hora_fin !== undefined) {
      fields.push('hora_fin = ?')
      values.push(data.hora_fin)
    }
    if (data.ubicacion_gps !== undefined) {
      fields.push('ubicacion_gps = ?')
      values.push(JSON.stringify(data.ubicacion_gps))
    }
    if (data.condiciones_climaticas !== undefined) {
      fields.push('condiciones_climaticas = ?')
      values.push(JSON.stringify(data.condiciones_climaticas))
    }
    if (data.herramientas_insumos !== undefined) {
      fields.push('herramientas_insumos = ?')
      values.push(JSON.stringify(data.herramientas_insumos))
    }
    if (data.observaciones !== undefined) {
      fields.push('observaciones = ?')
      values.push(data.observaciones)
    }
    if (data.estado !== undefined) {
      fields.push('estado = ?')
      values.push(data.estado)
    }
    if (data.actividad_planificada_id !== undefined) {
      fields.push('actividad_planificada_id = ?')
      values.push(data.actividad_planificada_id)
    }

    // Agregar métricas si se proporcionan
    if (metricas) {
      fields.push('duracion_minutos = ?')
      values.push(metricas.duracionMinutos)
      fields.push('rendimiento_por_hora = ?')
      values.push(metricas.rendimientoPorHora)
      fields.push('costo_estimado = ?')
      values.push(metricas.costoEstimado)
    }

    if (fields.length === 0) {
      return false
    }

    fields.push('ultima_modificacion = NOW()')
    values.push(id)

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE labores SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    return result.affectedRows > 0
  }

  /**
   * Eliminar una labor
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM labores WHERE id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  /**
   * Verificar si una labor existe
   */
  static async exists(id: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM labores WHERE id = ?',
      [id]
    )
    return rows[0].count > 0
  }

  /**
   * Parsear campos JSON de la base de datos
   */
  private static parseJsonFields(labores: Labor[]): Labor[] {
    return labores.map(labor => ({
      ...labor,
      ubicacion_gps: typeof labor.ubicacion_gps === 'string' 
        ? JSON.parse(labor.ubicacion_gps) 
        : labor.ubicacion_gps,
      condiciones_climaticas: labor.condiciones_climaticas && typeof labor.condiciones_climaticas === 'string'
        ? JSON.parse(labor.condiciones_climaticas)
        : labor.condiciones_climaticas,
      herramientas_insumos: labor.herramientas_insumos && typeof labor.herramientas_insumos === 'string'
        ? JSON.parse(labor.herramientas_insumos)
        : labor.herramientas_insumos,
      fotos: labor.fotos && typeof labor.fotos === 'string'
        ? JSON.parse(labor.fotos)
        : labor.fotos
    }))
  }
}

