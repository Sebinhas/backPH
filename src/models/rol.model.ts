import pool from '../config/database';

export interface Rol {
  id: number;
  nombre: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRolDTO {
  nombre: string;
}

export interface UpdateRolDTO {
  nombre?: string;
}

export class RolModel {
  static async findAll(): Promise<Rol[]> {
    const [rows] = await pool.query(
      'SELECT id, nombre, created_at, updated_at FROM roles ORDER BY created_at DESC'
    );
    return rows as Rol[];
  }

  static async findById(id: number): Promise<Rol | null> {
    const [rows] = await pool.query(
      'SELECT id, nombre, created_at, updated_at FROM roles WHERE id = ?',
      [id]
    );
    const roles = rows as Rol[];
    return roles.length > 0 ? roles[0] : null;
  }

  static async findByName(nombre: string): Promise<Rol | null> {
    const [rows] = await pool.query(
      'SELECT id, nombre, created_at, updated_at FROM roles WHERE nombre = ?',
      [nombre]
    );
    const roles = rows as Rol[];
    return roles.length > 0 ? roles[0] : null;
  }

  static async create(data: CreateRolDTO): Promise<Rol> {
    const [result] = await pool.query(
      'INSERT INTO roles (nombre) VALUES (?)',
      [data.nombre.trim()]
    );
    
    const insertResult = result as any;
    const newRol = await this.findById(insertResult.insertId);
    
    if (!newRol) {
      throw new Error('Error al crear el rol');
    }
    
    return newRol;
  }

  static async update(id: number, data: UpdateRolDTO): Promise<Rol> {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.nombre !== undefined) {
      updateFields.push('nombre = ?');
      values.push(data.nombre.trim());
    }

    if (updateFields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await pool.query(
      `UPDATE roles SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    const updatedRol = await this.findById(id);
    if (!updatedRol) {
      throw new Error('Rol no encontrado después de la actualización');
    }

    return updatedRol;
  }

  static async delete(id: number): Promise<void> {
    const [result] = await pool.query(
      'DELETE FROM roles WHERE id = ?',
      [id]
    );
    
    const deleteResult = result as any;
    if (deleteResult.affectedRows === 0) {
      throw new Error('Rol no encontrado');
    }
  }

  static async count(): Promise<number> {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM roles');
    const result = rows as any[];
    return result[0].count;
  }
}
