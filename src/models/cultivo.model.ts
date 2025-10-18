import { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/database'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export enum TipoCultivo {
  HORTALIZA = 'Hortaliza',
  FRUTA = 'Fruta',
  CEREAL = 'Cereal',
  LEGUMINOSA = 'Leguminosa',
  TUBERCULO = 'Tubérculo',
  FLOR = 'Flor',
  OTRO = 'Otro'
}

export interface Cultivo extends RowDataPacket {
  id: number
  nombre: string
  nombre_cientifico?: string
  tipo: TipoCultivo
  ciclo_dias: number
  descripcion?: string
  activo: boolean
  fecha_creacion: Date
}

export interface CreateCultivoDto {
  nombre: string
  nombre_cientifico?: string
  tipo: TipoCultivo
  ciclo_dias: number
  descripcion?: string
}

export interface UpdateCultivoDto {
  nombre?: string
  nombre_cientifico?: string
  tipo?: TipoCultivo
  ciclo_dias?: number
  descripcion?: string
  activo?: boolean
}

// ============================================================================
// MODELO
// ============================================================================

export class CultivoModel {
  /**
   * Obtener todos los cultivos
   */
  static async findAll(): Promise<Cultivo[]> {
    const [rows] = await pool.execute<Cultivo[]>(
      'SELECT * FROM cultivos ORDER BY fecha_creacion DESC'
    )
    return rows
  }

  /**
   * Obtener solo cultivos activos
   */
  static async findActive(): Promise<Cultivo[]> {
    const [rows] = await pool.execute<Cultivo[]>(
      'SELECT * FROM cultivos WHERE activo = TRUE ORDER BY nombre ASC'
    )
    return rows
  }

  /**
   * Obtener un cultivo por ID
   */
  static async findById(id: number): Promise<Cultivo | null> {
    const [rows] = await pool.execute<Cultivo[]>(
      'SELECT * FROM cultivos WHERE id = ?',
      [id]
    )
    return rows[0] || null
  }

  /**
   * Crear un nuevo cultivo
   */
  static async create(data: CreateCultivoDto): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO cultivos (nombre, nombre_cientifico, tipo, ciclo_dias, descripcion) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.nombre,
        data.nombre_cientifico || null,
        data.tipo,
        data.ciclo_dias,
        data.descripcion || null
      ]
    )
    return result.insertId
  }

  /**
   * Actualizar un cultivo
   */
  static async update(id: number, data: UpdateCultivoDto): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.nombre !== undefined) {
      fields.push('nombre = ?')
      values.push(data.nombre)
    }
    if (data.nombre_cientifico !== undefined) {
      fields.push('nombre_cientifico = ?')
      values.push(data.nombre_cientifico)
    }
    if (data.tipo !== undefined) {
      fields.push('tipo = ?')
      values.push(data.tipo)
    }
    if (data.ciclo_dias !== undefined) {
      fields.push('ciclo_dias = ?')
      values.push(data.ciclo_dias)
    }
    if (data.descripcion !== undefined) {
      fields.push('descripcion = ?')
      values.push(data.descripcion)
    }
    if (data.activo !== undefined) {
      fields.push('activo = ?')
      values.push(data.activo)
    }

    if (fields.length === 0) {
      return false
    }

    values.push(id)

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE cultivos SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    return result.affectedRows > 0
  }

  /**
   * Eliminar (soft delete) un cultivo
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE cultivos SET activo = FALSE WHERE id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  /**
   * Verificar si un cultivo existe
   */
  static async exists(id: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM cultivos WHERE id = ?',
      [id]
    )
    return rows[0].count > 0
  }

  /**
   * Verificar si un cultivo está siendo usado en lotes
   */
  static async isUsedInLotes(id: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM lotes WHERE cultivo_id = ?',
      [id]
    )
    return rows[0].count > 0
  }
}

