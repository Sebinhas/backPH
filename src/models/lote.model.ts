import { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/database'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export enum EstadoLote {
  EN_CRECIMIENTO = 'EN_CRECIMIENTO',
  EN_COSECHA = 'EN_COSECHA',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
  INACTIVO = 'INACTIVO'
}

export enum TipoSuelo {
  ARCILLOSO = 'ARCILLOSO',
  ARENOSO = 'ARENOSO',
  LIMOSO = 'LIMOSO',
  FRANCO = 'FRANCO',
  HUMIFERO = 'HUMIFERO'
}

export enum Topografia {
  PLANO = 'PLANO',
  ONDULADO = 'ONDULADO',
  MONTAÑOSO = 'MONTAÑOSO'
}

export enum SistemaRiego {
  GOTEO = 'GOTEO',
  ASPERSION = 'ASPERSION',
  GRAVEDAD = 'GRAVEDAD',
  NINGUNO = 'NINGUNO'
}

export interface Coordenada {
  lat: number
  lng: number
}

export interface Lote extends RowDataPacket {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  area_hectareas: number
  perimetro_metros?: number
  altitud_msnm?: number
  cultivo_id?: number
  cultivo_nombre?: string
  estado: EstadoLote
  tipo_suelo?: TipoSuelo
  ph_suelo?: number
  topografia?: Topografia
  sistema_riego?: SistemaRiego
  tiene_cerca: boolean
  tiene_sombra: boolean
  acceso_vehicular: boolean
  notas?: string
  fecha_creacion: Date
  fecha_ultima_modificacion: Date
  fecha_ultima_actividad?: Date
  proxima_actividad?: string
  coordenadas?: Coordenada[]
}

export interface CreateLoteDto {
  codigo: string
  nombre: string
  descripcion?: string
  area_hectareas: number
  perimetro_metros?: number
  altitud_msnm?: number
  cultivo_id?: number
  estado?: EstadoLote
  tipo_suelo?: TipoSuelo
  ph_suelo?: number
  topografia?: Topografia
  sistema_riego?: SistemaRiego
  tiene_cerca?: boolean
  tiene_sombra?: boolean
  acceso_vehicular?: boolean
  notas?: string
  coordenadas: Coordenada[]
}

export interface UpdateLoteDto {
  codigo?: string
  nombre?: string
  descripcion?: string
  area_hectareas?: number
  perimetro_metros?: number
  altitud_msnm?: number
  cultivo_id?: number
  estado?: EstadoLote
  tipo_suelo?: TipoSuelo
  ph_suelo?: number
  topografia?: Topografia
  sistema_riego?: SistemaRiego
  tiene_cerca?: boolean
  tiene_sombra?: boolean
  acceso_vehicular?: boolean
  notas?: string
  fecha_ultima_actividad?: Date
  proxima_actividad?: string
  coordenadas?: Coordenada[]
}

// ============================================================================
// MODELO
// ============================================================================

export class LoteModel {
  /**
   * Obtener todos los lotes con sus coordenadas y cultivo
   */
  static async findAll(): Promise<Lote[]> {
    const [lotes] = await pool.execute<Lote[]>(`
      SELECT l.*, c.nombre as cultivo_nombre
      FROM lotes l
      LEFT JOIN cultivos c ON l.cultivo_id = c.id
      ORDER BY l.fecha_creacion DESC
    `)

    // Cargar coordenadas para cada lote
    for (const lote of lotes) {
      lote.coordenadas = await this.getCoordenadas(lote.id)
    }

    return lotes
  }

  /**
   * Obtener un lote por ID con sus coordenadas
   */
  static async findById(id: number): Promise<Lote | null> {
    const [rows] = await pool.execute<Lote[]>(`
      SELECT l.*, c.nombre as cultivo_nombre
      FROM lotes l
      LEFT JOIN cultivos c ON l.cultivo_id = c.id
      WHERE l.id = ?
    `, [id])

    if (rows.length === 0) return null

    const lote = rows[0]
    lote.coordenadas = await this.getCoordenadas(id)

    return lote
  }

  /**
   * Obtener coordenadas de un lote
   */
  static async getCoordenadas(loteId: number): Promise<Coordenada[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT latitud as lat, longitud as lng
      FROM lote_coordenadas
      WHERE lote_id = ?
      ORDER BY orden ASC
    `, [loteId])

    return rows as Coordenada[]
  }

  /**
   * Crear un nuevo lote
   */
  static async create(data: CreateLoteDto): Promise<number> {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      // Insertar lote
      const [result] = await connection.execute<ResultSetHeader>(`
        INSERT INTO lotes (
          codigo, nombre, descripcion, area_hectareas, perimetro_metros,
          altitud_msnm, cultivo_id, estado, tipo_suelo, ph_suelo,
          topografia, sistema_riego, tiene_cerca, tiene_sombra,
          acceso_vehicular, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.codigo,
        data.nombre,
        data.descripcion || null,
        data.area_hectareas,
        data.perimetro_metros || null,
        data.altitud_msnm || null,
        data.cultivo_id || null,
        data.estado || EstadoLote.EN_CRECIMIENTO,
        data.tipo_suelo || null,
        data.ph_suelo || null,
        data.topografia || null,
        data.sistema_riego || null,
        data.tiene_cerca || false,
        data.tiene_sombra || false,
        data.acceso_vehicular || false,
        data.notas || null
      ])

      const loteId = result.insertId

      // Insertar coordenadas
      if (data.coordenadas && data.coordenadas.length > 0) {
        for (let i = 0; i < data.coordenadas.length; i++) {
          await connection.execute(`
            INSERT INTO lote_coordenadas (lote_id, latitud, longitud, orden)
            VALUES (?, ?, ?, ?)
          `, [loteId, data.coordenadas[i].lat, data.coordenadas[i].lng, i])
        }
      }

      await connection.commit()
      return loteId
      
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  /**
   * Actualizar un lote
   */
  static async update(id: number, data: UpdateLoteDto): Promise<boolean> {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      const fields: string[] = []
      const values: any[] = []

      if (data.codigo !== undefined) { fields.push('codigo = ?'); values.push(data.codigo) }
      if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre) }
      if (data.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(data.descripcion) }
      if (data.area_hectareas !== undefined) { fields.push('area_hectareas = ?'); values.push(data.area_hectareas) }
      if (data.perimetro_metros !== undefined) { fields.push('perimetro_metros = ?'); values.push(data.perimetro_metros) }
      if (data.altitud_msnm !== undefined) { fields.push('altitud_msnm = ?'); values.push(data.altitud_msnm) }
      if (data.cultivo_id !== undefined) { fields.push('cultivo_id = ?'); values.push(data.cultivo_id) }
      if (data.estado !== undefined) { fields.push('estado = ?'); values.push(data.estado) }
      if (data.tipo_suelo !== undefined) { fields.push('tipo_suelo = ?'); values.push(data.tipo_suelo) }
      if (data.ph_suelo !== undefined) { fields.push('ph_suelo = ?'); values.push(data.ph_suelo) }
      if (data.topografia !== undefined) { fields.push('topografia = ?'); values.push(data.topografia) }
      if (data.sistema_riego !== undefined) { fields.push('sistema_riego = ?'); values.push(data.sistema_riego) }
      if (data.tiene_cerca !== undefined) { fields.push('tiene_cerca = ?'); values.push(data.tiene_cerca) }
      if (data.tiene_sombra !== undefined) { fields.push('tiene_sombra = ?'); values.push(data.tiene_sombra) }
      if (data.acceso_vehicular !== undefined) { fields.push('acceso_vehicular = ?'); values.push(data.acceso_vehicular) }
      if (data.notas !== undefined) { fields.push('notas = ?'); values.push(data.notas) }
      if (data.fecha_ultima_actividad !== undefined) { fields.push('fecha_ultima_actividad = ?'); values.push(data.fecha_ultima_actividad) }
      if (data.proxima_actividad !== undefined) { fields.push('proxima_actividad = ?'); values.push(data.proxima_actividad) }

      if (fields.length > 0) {
        values.push(id)
        const [result] = await connection.execute<ResultSetHeader>(
          `UPDATE lotes SET ${fields.join(', ')} WHERE id = ?`,
          values
        )

        if (result.affectedRows === 0) {
          await connection.rollback()
          return false
        }
      }

      // Actualizar coordenadas si se proporcionan
      if (data.coordenadas && data.coordenadas.length > 0) {
        // Eliminar coordenadas anteriores
        await connection.execute('DELETE FROM lote_coordenadas WHERE lote_id = ?', [id])
        
        // Insertar nuevas coordenadas
        for (let i = 0; i < data.coordenadas.length; i++) {
          await connection.execute(`
            INSERT INTO lote_coordenadas (lote_id, latitud, longitud, orden)
            VALUES (?, ?, ?, ?)
          `, [id, data.coordenadas[i].lat, data.coordenadas[i].lng, i])
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
   * Eliminar un lote y sus coordenadas
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM lotes WHERE id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  /**
   * Verificar si un lote existe
   */
  static async exists(id: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM lotes WHERE id = ?',
      [id]
    )
    return rows[0].count > 0
  }

  /**
   * Verificar si un código ya existe
   */
  static async codigoExists(codigo: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM lotes WHERE codigo = ?'
    const params: any[] = [codigo]
    
    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params)
    return rows[0].count > 0
  }

  /**
   * Obtener estadísticas de lotes
   */
  static async getEstadisticas(): Promise<any> {
    const [stats] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_lotes,
        SUM(area_hectareas) as total_hectareas,
        AVG(area_hectareas) as promedio_hectareas,
        COUNT(CASE WHEN estado = 'EN_CRECIMIENTO' THEN 1 END) as en_crecimiento,
        COUNT(CASE WHEN estado = 'EN_COSECHA' THEN 1 END) as en_cosecha,
        COUNT(CASE WHEN estado = 'EN_MANTENIMIENTO' THEN 1 END) as en_mantenimiento,
        COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END) as inactivos
      FROM lotes
    `)
    
    return stats[0]
  }
}

