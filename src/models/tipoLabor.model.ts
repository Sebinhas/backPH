import { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/database'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export enum CategoriaTipoLabor {
  SIEMBRA = 'siembra',
  COSECHA = 'cosecha',
  RIEGO = 'riego',
  FERTILIZACION = 'fertilizacion',
  CONTROL_PLAGAS = 'control_plagas',
  MANTENIMIENTO = 'mantenimiento',
  OTRO = 'otro'
}

export interface TipoLabor extends RowDataPacket {
  id: number
  nombre: string
  descripcion?: string
  categoria: CategoriaTipoLabor
  fecha_creacion: Date
  ultima_modificacion?: Date
}

export interface CreateTipoLaborDto {
  nombre: string
  descripcion?: string
  categoria: CategoriaTipoLabor
}

export interface UpdateTipoLaborDto {
  nombre?: string
  descripcion?: string
  categoria?: CategoriaTipoLabor
}

// ============================================================================
// MODELO
// ============================================================================

export class TipoLaborModel {
  /**
   * Obtener todos los tipos de labor
   */
  static async findAll(): Promise<TipoLabor[]> {
    const [rows] = await pool.execute<TipoLabor[]>(
      'SELECT * FROM tipos_labor ORDER BY fecha_creacion DESC'
    )
    return rows
  }

  /**
   * Obtener un tipo de labor por ID
   */
  static async findById(id: number): Promise<TipoLabor | null> {
    const [rows] = await pool.execute<TipoLabor[]>(
      'SELECT * FROM tipos_labor WHERE id = ?',
      [id]
    )
    return rows[0] || null
  }

  /**
   * Buscar tipos de labor por query
   */
  static async search(query: string): Promise<TipoLabor[]> {
    const searchTerm = `%${query}%`
    const [rows] = await pool.execute<TipoLabor[]>(
      `SELECT * FROM tipos_labor 
       WHERE nombre LIKE ? 
       OR descripcion LIKE ? 
       OR categoria LIKE ?
       ORDER BY nombre ASC`,
      [searchTerm, searchTerm, searchTerm]
    )
    return rows
  }

  /**
   * Buscar tipo de labor por nombre (case-insensitive)
   */
  static async findByNombre(nombre: string): Promise<TipoLabor | null> {
    const [rows] = await pool.execute<TipoLabor[]>(
      'SELECT * FROM tipos_labor WHERE LOWER(nombre) = LOWER(?)',
      [nombre]
    )
    return rows[0] || null
  }

  /**
   * Crear un nuevo tipo de labor
   */
  static async create(data: CreateTipoLaborDto): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO tipos_labor (nombre, descripcion, categoria) 
       VALUES (?, ?, ?)`,
      [
        data.nombre,
        data.descripcion || null,
        data.categoria
      ]
    )
    return result.insertId
  }

  /**
   * Actualizar un tipo de labor
   */
  static async update(id: number, data: UpdateTipoLaborDto): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.nombre !== undefined) {
      fields.push('nombre = ?')
      values.push(data.nombre)
    }
    if (data.descripcion !== undefined) {
      fields.push('descripcion = ?')
      values.push(data.descripcion)
    }
    if (data.categoria !== undefined) {
      fields.push('categoria = ?')
      values.push(data.categoria)
    }

    if (fields.length === 0) {
      return false
    }

    fields.push('ultima_modificacion = NOW()')
    values.push(id)

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE tipos_labor SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    return result.affectedRows > 0
  }

  /**
   * Eliminar un tipo de labor
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM tipos_labor WHERE id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  /**
   * Verificar si un tipo de labor existe
   */
  static async exists(id: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM tipos_labor WHERE id = ?',
      [id]
    )
    return rows[0].count > 0
  }

  /**
   * Verificar si el nombre ya está en uso (excluyendo un ID específico)
   */
  static async isNombreTaken(nombre: string, excludeId?: number): Promise<boolean> {
    const query = excludeId
      ? 'SELECT COUNT(*) as count FROM tipos_labor WHERE LOWER(nombre) = LOWER(?) AND id != ?'
      : 'SELECT COUNT(*) as count FROM tipos_labor WHERE LOWER(nombre) = LOWER(?)'
    
    const params = excludeId ? [nombre, excludeId] : [nombre]
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params)
    return rows[0].count > 0
  }

  /**
   * Verificar si un tipo de labor está siendo usado en labores
   */
  static async isUsedInLabores(id: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM labores WHERE tipo_labor_id = ?',
      [id]
    )
    return rows[0].count > 0
  }
}

