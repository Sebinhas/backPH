import { 
  TipoLaborModel, 
  TipoLabor, 
  CreateTipoLaborDto, 
  UpdateTipoLaborDto 
} from '../models/tipoLabor.model'

// ============================================================================
// SERVICIO DE TIPOS DE LABOR
// ============================================================================

export class TiposLaborService {
  /**
   * Obtener todos los tipos de labor
   */
  async getAllTiposLabor(): Promise<TipoLabor[]> {
    return await TipoLaborModel.findAll()
  }

  /**
   * Obtener un tipo de labor por ID
   */
  async getTipoLaborById(id: number): Promise<TipoLabor> {
    const tipoLabor = await TipoLaborModel.findById(id)
    
    if (!tipoLabor) {
      throw new Error('Tipo de labor no encontrado')
    }
    
    return tipoLabor
  }

  /**
   * Buscar tipos de labor
   */
  async searchTiposLabor(query: string): Promise<TipoLabor[]> {
    if (!query || query.trim().length === 0) {
      return await this.getAllTiposLabor()
    }
    
    return await TipoLaborModel.search(query.trim())
  }

  /**
   * Crear un nuevo tipo de labor
   */
  async createTipoLabor(data: CreateTipoLaborDto): Promise<TipoLabor> {
    // Validaciones
    if (!data.nombre || data.nombre.trim().length < 3) {
      throw new Error('El nombre debe tener al menos 3 caracteres')
    }

    if (!data.categoria) {
      throw new Error('La categoría es requerida')
    }

    // Verificar unicidad del nombre (case-insensitive)
    const nombreExists = await TipoLaborModel.isNombreTaken(data.nombre)
    if (nombreExists) {
      throw new Error('Ya existe un tipo de labor con ese nombre')
    }

    // Crear tipo de labor
    const id = await TipoLaborModel.create(data)
    
    // Obtener el tipo de labor creado
    const tipoLabor = await TipoLaborModel.findById(id)
    
    if (!tipoLabor) {
      throw new Error('Error al crear el tipo de labor')
    }
    
    return tipoLabor
  }

  /**
   * Actualizar un tipo de labor
   */
  async updateTipoLabor(id: number, data: UpdateTipoLaborDto): Promise<TipoLabor> {
    // Verificar que el tipo de labor existe
    const exists = await TipoLaborModel.exists(id)
    if (!exists) {
      throw new Error('Tipo de labor no encontrado')
    }

    // Validaciones
    if (data.nombre !== undefined && data.nombre.trim().length < 3) {
      throw new Error('El nombre debe tener al menos 3 caracteres')
    }

    // Verificar unicidad del nombre si se proporciona (case-insensitive)
    if (data.nombre !== undefined) {
      const nombreExists = await TipoLaborModel.isNombreTaken(data.nombre, id)
      if (nombreExists) {
        throw new Error('Ya existe un tipo de labor con ese nombre')
      }
    }

    // Actualizar
    const updated = await TipoLaborModel.update(id, data)
    
    if (!updated) {
      throw new Error('No se pudo actualizar el tipo de labor')
    }

    // Obtener el tipo de labor actualizado
    const tipoLabor = await TipoLaborModel.findById(id)
    
    if (!tipoLabor) {
      throw new Error('Error al obtener el tipo de labor actualizado')
    }
    
    return tipoLabor
  }

  /**
   * Eliminar un tipo de labor
   */
  async deleteTipoLabor(id: number): Promise<void> {
    // Verificar que el tipo de labor existe
    const exists = await TipoLaborModel.exists(id)
    if (!exists) {
      throw new Error('Tipo de labor no encontrado')
    }

    // Verificar si está siendo usado en labores
    const isUsed = await TipoLaborModel.isUsedInLabores(id)
    if (isUsed) {
      throw new Error('No se puede eliminar el tipo de labor porque está siendo usado en registros de labores')
    }

    // Eliminar tipo de labor
    await TipoLaborModel.delete(id)
  }
}

export const tiposLaborService = new TiposLaborService()

