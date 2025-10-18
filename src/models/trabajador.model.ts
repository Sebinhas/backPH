import { ResultSetHeader, RowDataPacket } from 'mysql2'
import pool from '../config/database'

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export enum TipoDocumento {
  DNI = 'DNI',
  PASAPORTE = 'Pasaporte',
  CEDULA = 'Cédula',
  OTRO = 'Otro'
}

export enum EstadoTrabajador {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  VACACIONES = 'vacaciones',
  LICENCIA = 'licencia'
}

export interface Trabajador extends RowDataPacket {
  id: number
  nombres: string
  apellidos: string
  documento: string
  tipo_documento: TipoDocumento
  telefono: string
  email: string
  cargo: string
  fecha_ingreso: string // YYYY-MM-DD
  estado: EstadoTrabajador
  direccion: string
  fecha_creacion: Date
  ultima_modificacion?: Date
}

export interface CreateTrabajadorDto {
  nombres: string
  apellidos: string
  documento: string
  tipo_documento: TipoDocumento
  telefono: string
  email: string
  cargo: string
  fecha_ingreso: string // YYYY-MM-DD
  direccion: string
}

export interface UpdateTrabajadorDto {
  nombres?: string
  apellidos?: string
  documento?: string
  tipo_documento?: TipoDocumento
  telefono?: string
  email?: string
  cargo?: string
  fecha_ingreso?: string // YYYY-MM-DD
  estado?: EstadoTrabajador
  direccion?: string
}

// ============================================================================
// MODELO
// ============================================================================

export class TrabajadorModel {
  /**
   * Obtener todos los trabajadores
   */
  static async findAll(): Promise<Trabajador[]> {
    const [rows] = await pool.execute<Trabajador[]>(
      'SELECT * FROM trabajadores ORDER BY fecha_creacion DESC'
    )
    return rows
  }

  /**
   * Obtener un trabajador por ID
   */
  static async findById(id: number): Promise<Trabajador | null> {
    const [rows] = await pool.execute<Trabajador[]>(
      'SELECT * FROM trabajadores WHERE id = ?',
      [id]
    )
    return rows[0] || null
  }

  /**
   * Buscar trabajadores por query
   */
  static async search(query: string): Promise<Trabajador[]> {
    const searchTerm = `%${query}%`
    const [rows] = await pool.execute<Trabajador[]>(
      `SELECT * FROM trabajadores 
       WHERE nombres LIKE ? 
       OR apellidos LIKE ? 
       OR email LIKE ? 
       OR documento LIKE ? 
       OR cargo LIKE ?
       ORDER BY nombres ASC`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    )
    return rows
  }

  /**
   * Buscar trabajador por email
   */
  static async findByEmail(email: string): Promise<Trabajador | null> {
    const [rows] = await pool.execute<Trabajador[]>(
      'SELECT * FROM trabajadores WHERE email = ?',
      [email]
    )
    return rows[0] || null
  }

  /**
   * Buscar trabajador por documento
   */
  static async findByDocumento(documento: string): Promise<Trabajador | null> {
    const [rows] = await pool.execute<Trabajador[]>(
      'SELECT * FROM trabajadores WHERE documento = ?',
      [documento]
    )
    return rows[0] || null
  }

  /**
   * Crear un nuevo trabajador
   */
  static async create(data: CreateTrabajadorDto): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO trabajadores 
       (nombres, apellidos, documento, tipo_documento, telefono, email, cargo, fecha_ingreso, direccion, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombres,
        data.apellidos,
        data.documento,
        data.tipo_documento,
        data.telefono,
        data.email,
        data.cargo,
        data.fecha_ingreso,
        data.direccion,
        EstadoTrabajador.ACTIVO
      ]
    )
    return result.insertId
  }

  /**
   * Actualizar un trabajador
   */
  static async update(id: number, data: UpdateTrabajadorDto): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.nombres !== undefined) {
      fields.push('nombres = ?')
      values.push(data.nombres)
    }
    if (data.apellidos !== undefined) {
      fields.push('apellidos = ?')
      values.push(data.apellidos)
    }
    if (data.documento !== undefined) {
      fields.push('documento = ?')
      values.push(data.documento)
    }
    if (data.tipo_documento !== undefined) {
      fields.push('tipo_documento = ?')
      values.push(data.tipo_documento)
    }
    if (data.telefono !== undefined) {
      fields.push('telefono = ?')
      values.push(data.telefono)
    }
    if (data.email !== undefined) {
      fields.push('email = ?')
      values.push(data.email)
    }
    if (data.cargo !== undefined) {
      fields.push('cargo = ?')
      values.push(data.cargo)
    }
    if (data.fecha_ingreso !== undefined) {
      fields.push('fecha_ingreso = ?')
      values.push(data.fecha_ingreso)
    }
    if (data.estado !== undefined) {
      fields.push('estado = ?')
      values.push(data.estado)
    }
    if (data.direccion !== undefined) {
      fields.push('direccion = ?')
      values.push(data.direccion)
    }

    if (fields.length === 0) {
      return false
    }

    fields.push('ultima_modificacion = NOW()')
    values.push(id)

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE trabajadores SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    return result.affectedRows > 0
  }

  /**
   * Eliminar un trabajador
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM trabajadores WHERE id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  /**
   * Verificar si un trabajador existe
   */
  static async exists(id: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM trabajadores WHERE id = ?',
      [id]
    )
    return rows[0].count > 0
  }

  /**
   * Verificar si el email ya está en uso (excluyendo un ID específico)
   */
  static async isEmailTaken(email: string, excludeId?: number): Promise<boolean> {
    const query = excludeId
      ? 'SELECT COUNT(*) as count FROM trabajadores WHERE email = ? AND id != ?'
      : 'SELECT COUNT(*) as count FROM trabajadores WHERE email = ?'
    
    const params = excludeId ? [email, excludeId] : [email]
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params)
    return rows[0].count > 0
  }

  /**
   * Verificar si el documento ya está en uso (excluyendo un ID específico)
   */
  static async isDocumentoTaken(documento: string, excludeId?: number): Promise<boolean> {
    const query = excludeId
      ? 'SELECT COUNT(*) as count FROM trabajadores WHERE documento = ? AND id != ?'
      : 'SELECT COUNT(*) as count FROM trabajadores WHERE documento = ?'
    
    const params = excludeId ? [documento, excludeId] : [documento]
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params)
    return rows[0].count > 0
  }
}

