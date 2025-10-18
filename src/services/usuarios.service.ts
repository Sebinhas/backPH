import { ApiError } from '../middlewares/errorHandler';
import { UserModel } from '../models/user.model';
import bcrypt from 'bcryptjs';
import { Usuario } from '../types';

export interface CreateUsuarioDTO {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface UpdateUsuarioDTO {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: string;
}

export class UsuariosService {
  static async getUsuarios(): Promise<Usuario[]> {
    try {
      return await UserModel.findAll();
    } catch (error) {
      throw new ApiError(500, 'Error al obtener los usuarios');
    }
  }

  static async getUsuario(id: number): Promise<Usuario> {
    try {
      const usuario = await UserModel.findById(id);
      if (!usuario) {
        throw new ApiError(404, 'Usuario no encontrado');
      }
      return usuario;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error al obtener el usuario');
    }
  }

  static async createUsuario(data: CreateUsuarioDTO): Promise<Usuario> {
    try {
      // Validaciones
      if (!data.nombre || data.nombre.trim().length < 2) {
        throw new ApiError(400, 'El nombre debe tener al menos 2 caracteres');
      }

      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new ApiError(400, 'El email no es válido');
      }

      if (!data.password || data.password.length < 6) {
        throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres');
      }

      if (!data.rol || data.rol.trim().length < 2) {
        throw new ApiError(400, 'El rol es requerido');
      }

      // Verificar que el email sea único
      const existingUser = await UserModel.findByEmail(data.email);
      if (existingUser) {
        throw new ApiError(409, 'Ya existe un usuario con ese email');
      }

      // Verificar límite de usuarios
      const count = await UserModel.count();
      if (count >= 1000) {
        throw new ApiError(400, 'Se ha alcanzado el límite máximo de usuarios (1000)');
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Crear usuario
      return await UserModel.create({
        nombre: data.nombre.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        rol: data.rol.trim()
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error al crear el usuario');
    }
  }

  static async updateUsuario(id: number, data: UpdateUsuarioDTO): Promise<Usuario> {
    try {
      // Verificar que el usuario existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      // Validar email si se proporciona
      if (data.email !== undefined) {
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          throw new ApiError(400, 'El email no es válido');
        }

        // Verificar que el email sea único (excepto el usuario actual)
        const duplicateUser = await UserModel.findByEmail(data.email);
        if (duplicateUser && duplicateUser.id !== id) {
          throw new ApiError(409, 'Ya existe un usuario con ese email');
        }
      }

      // Validar nombre si se proporciona
      if (data.nombre !== undefined && data.nombre.trim().length < 2) {
        throw new ApiError(400, 'El nombre debe tener al menos 2 caracteres');
      }

      // Validar contraseña si se proporciona
      if (data.password !== undefined && data.password.length < 6) {
        throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres');
      }

      // Preparar datos para actualización
      const updateData: any = {};
      
      if (data.nombre !== undefined) {
        updateData.nombre = data.nombre.trim();
      }
      if (data.email !== undefined) {
        updateData.email = data.email.trim().toLowerCase();
      }
      if (data.rol !== undefined) {
        updateData.rol = data.rol.trim();
      }

      // Encriptar contraseña si se proporciona
      if (data.password !== undefined) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      // Actualizar usuario
      return await UserModel.update(id, updateData);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error al actualizar el usuario');
    }
  }

  static async deleteUsuario(id: number): Promise<void> {
    try {
      // Verificar que el usuario existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      // Eliminar usuario
      await UserModel.delete(id);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error al eliminar el usuario');
    }
  }

  static async getEstadisticas(): Promise<{
    totalUsuarios: number;
    usuariosActivos: number;
    usuariosPorRol: Record<string, number>;
  }> {
    try {
      const usuarios = await UserModel.findAll();
      
      const totalUsuarios = usuarios.length;
      const usuariosActivos = usuarios.length; // Todos los usuarios están activos por defecto
      
      const usuariosPorRol = usuarios.reduce((acc, usuario) => {
        acc[usuario.rol] = (acc[usuario.rol] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalUsuarios,
        usuariosActivos,
        usuariosPorRol
      };
    } catch (error) {
      throw new ApiError(500, 'Error al obtener las estadísticas');
    }
  }
}