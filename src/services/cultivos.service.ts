import { CultivoModel, Cultivo, CreateCultivoDto, UpdateCultivoDto } from '../models/cultivo.model'

// ============================================================================
// SERVICIO DE CULTIVOS
// ============================================================================

export class CultivosService {
  /**
   * Obtener todos los cultivos
   */
  async getAllCultivos(): Promise<Cultivo[]> {
    return await CultivoModel.findAll()
  }

  /**
   * Obtener solo cultivos activos
   */
  async getActiveCultivos(): Promise<Cultivo[]> {
    return await CultivoModel.findActive()
  }

  /**
   * Obtener un cultivo por ID
   */
  async getCultivoById(id: number): Promise<Cultivo> {
    const cultivo = await CultivoModel.findById(id)
    
    if (!cultivo) {
      throw new Error('Cultivo no encontrado')
    }
    
    return cultivo
  }

  /**
   * Crear un nuevo cultivo
   */
  async createCultivo(data: CreateCultivoDto): Promise<Cultivo> {
    // Validaciones
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new Error('El nombre del cultivo es requerido')
    }

    if (!data.tipo) {
      throw new Error('El tipo de cultivo es requerido')
    }

    if (!data.ciclo_dias || data.ciclo_dias <= 0) {
      throw new Error('El ciclo de días debe ser mayor a 0')
    }

    // Crear cultivo
    const id = await CultivoModel.create(data)
    
    // Obtener el cultivo creado
    const cultivo = await CultivoModel.findById(id)
    
    if (!cultivo) {
      throw new Error('Error al crear el cultivo')
    }
    
    return cultivo
  }

  /**
   * Actualizar un cultivo
   */
  async updateCultivo(id: number, data: UpdateCultivoDto): Promise<Cultivo> {
    // Verificar que el cultivo existe
    const exists = await CultivoModel.exists(id)
    if (!exists) {
      throw new Error('Cultivo no encontrado')
    }

    // Validaciones
    if (data.nombre !== undefined && data.nombre.trim().length === 0) {
      throw new Error('El nombre del cultivo no puede estar vacío')
    }

    if (data.ciclo_dias !== undefined && data.ciclo_dias <= 0) {
      throw new Error('El ciclo de días debe ser mayor a 0')
    }

    // Actualizar
    const updated = await CultivoModel.update(id, data)
    
    if (!updated) {
      throw new Error('No se pudo actualizar el cultivo')
    }

    // Obtener el cultivo actualizado
    const cultivo = await CultivoModel.findById(id)
    
    if (!cultivo) {
      throw new Error('Error al obtener el cultivo actualizado')
    }
    
    return cultivo
  }

  /**
   * Eliminar (soft delete) un cultivo
   */
  async deleteCultivo(id: number): Promise<void> {
    // Verificar que el cultivo existe
    const exists = await CultivoModel.exists(id)
    if (!exists) {
      throw new Error('Cultivo no encontrado')
    }

    // Verificar si está siendo usado
    const isUsed = await CultivoModel.isUsedInLotes(id)
    if (isUsed) {
      // Solo marcarlo como inactivo, no eliminar
      await CultivoModel.delete(id)
      return
    }

    // Si no está siendo usado, también solo marcarlo como inactivo
    await CultivoModel.delete(id)
  }
}

export const cultivosService = new CultivosService()

