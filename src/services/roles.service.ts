import { ApiError } from '../middlewares/errorHandler';
import { RolModel, Rol, CreateRolDTO, UpdateRolDTO } from '../models/rol.model';

// Re-exportar las interfaces para uso en controladores
export { CreateRolDTO, UpdateRolDTO, Rol };

export class RolesService {
  static async getRoles(): Promise<Rol[]> {
    try {
      return await RolModel.findAll();
    } catch (error) {
      throw new ApiError(500, 'Error al obtener los roles');
    }
  }

  static async getRol(id: number): Promise<Rol> {
    try {
      const rol = await RolModel.findById(id);
      if (!rol) {
        throw new ApiError(404, 'Rol no encontrado');
      }
      return rol;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error al obtener el rol');
    }
  }

  static async createRol(data: CreateRolDTO): Promise<Rol> {
    try {
      // Validar nombre
      if (!data.nombre || data.nombre.trim().length < 3) {
        throw new ApiError(400, 'El nombre del rol debe tener al menos 3 caracteres');
      }

      if (data.nombre.length > 50) {
        throw new ApiError(400, 'El nombre del rol no puede exceder 50 caracteres');
      }

      // Verificar que el nombre sea único
      const existingRol = await RolModel.findByName(data.nombre.trim());
      if (existingRol) {
        throw new ApiError(409, 'Ya existe un rol con ese nombre');
      }

      // Verificar límite de roles
      const count = await RolModel.count();
      if (count >= 100) {
        throw new ApiError(400, 'Se ha alcanzado el límite máximo de roles (100)');
      }

      // Crear nuevo rol
      return await RolModel.create(data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error al crear el rol');
    }
  }

  static async updateRol(id: number, data: UpdateRolDTO): Promise<Rol> {
    try {
      // Verificar que el rol existe
      const existingRol = await RolModel.findById(id);
      if (!existingRol) {
        throw new ApiError(404, 'Rol no encontrado');
      }

      // Validar nombre si se proporciona
      if (data.nombre !== undefined) {
        if (data.nombre.trim().length < 3) {
          throw new ApiError(400, 'El nombre del rol debe tener al menos 3 caracteres');
        }

        if (data.nombre.length > 50) {
          throw new ApiError(400, 'El nombre del rol no puede exceder 50 caracteres');
        }

        // Verificar que el nombre sea único (excepto el rol actual)
        const duplicateRol = await RolModel.findByName(data.nombre.trim());
        if (duplicateRol && duplicateRol.id !== id) {
          throw new ApiError(409, 'Ya existe un rol con ese nombre');
        }
      }

      // Actualizar rol
      return await RolModel.update(id, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error al actualizar el rol');
    }
  }

  static async deleteRol(id: number): Promise<void> {
    try {
      // Verificar que el rol existe
      const existingRol = await RolModel.findById(id);
      if (!existingRol) {
        throw new ApiError(404, 'Rol no encontrado');
      }

      // Eliminar rol
      await RolModel.delete(id);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Error al eliminar el rol');
    }
  }
}