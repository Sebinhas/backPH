import { 
  TrabajadorModel, 
  Trabajador, 
  CreateTrabajadorDto, 
  UpdateTrabajadorDto 
} from '../models/trabajador.model'

// ============================================================================
// SERVICIO DE TRABAJADORES
// ============================================================================

export class TrabajadoresService {
  /**
   * Obtener todos los trabajadores
   */
  async getAllTrabajadores(): Promise<Trabajador[]> {
    return await TrabajadorModel.findAll()
  }

  /**
   * Obtener un trabajador por ID
   */
  async getTrabajadorById(id: number): Promise<Trabajador> {
    const trabajador = await TrabajadorModel.findById(id)
    
    if (!trabajador) {
      throw new Error('Trabajador no encontrado')
    }
    
    return trabajador
  }

  /**
   * Buscar trabajadores
   */
  async searchTrabajadores(query: string): Promise<Trabajador[]> {
    if (!query || query.trim().length === 0) {
      return await this.getAllTrabajadores()
    }
    
    return await TrabajadorModel.search(query.trim())
  }

  /**
   * Crear un nuevo trabajador
   */
  async createTrabajador(data: CreateTrabajadorDto): Promise<Trabajador> {
    // Validaciones
    if (!data.nombres || data.nombres.trim().length < 2) {
      throw new Error('Los nombres deben tener al menos 2 caracteres')
    }

    if (!data.apellidos || data.apellidos.trim().length < 2) {
      throw new Error('Los apellidos deben tener al menos 2 caracteres')
    }

    if (!data.documento || data.documento.trim().length < 5) {
      throw new Error('El documento debe tener al menos 5 caracteres')
    }

    if (!data.cargo || data.cargo.trim().length < 3) {
      throw new Error('El cargo debe tener al menos 3 caracteres')
    }

    if (!data.direccion || data.direccion.trim().length < 10) {
      throw new Error('La dirección debe tener al menos 10 caracteres')
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new Error('El formato del email es inválido')
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!fechaRegex.test(data.fecha_ingreso)) {
      throw new Error('El formato de fecha debe ser YYYY-MM-DD')
    }

    // Validar que la fecha no sea futura
    const fechaIngreso = new Date(data.fecha_ingreso)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    if (fechaIngreso > hoy) {
      throw new Error('La fecha de ingreso no puede ser futura')
    }

    // Verificar unicidad de email
    const emailExists = await TrabajadorModel.isEmailTaken(data.email)
    if (emailExists) {
      throw new Error('El email ya está registrado')
    }

    // Verificar unicidad de documento
    const documentoExists = await TrabajadorModel.isDocumentoTaken(data.documento)
    if (documentoExists) {
      throw new Error('El documento ya está registrado')
    }

    // Crear trabajador
    const id = await TrabajadorModel.create(data)
    
    // Obtener el trabajador creado
    const trabajador = await TrabajadorModel.findById(id)
    
    if (!trabajador) {
      throw new Error('Error al crear el trabajador')
    }
    
    return trabajador
  }

  /**
   * Actualizar un trabajador
   */
  async updateTrabajador(id: number, data: UpdateTrabajadorDto): Promise<Trabajador> {
    // Verificar que el trabajador existe
    const exists = await TrabajadorModel.exists(id)
    if (!exists) {
      throw new Error('Trabajador no encontrado')
    }

    // Validaciones
    if (data.nombres !== undefined && data.nombres.trim().length < 2) {
      throw new Error('Los nombres deben tener al menos 2 caracteres')
    }

    if (data.apellidos !== undefined && data.apellidos.trim().length < 2) {
      throw new Error('Los apellidos deben tener al menos 2 caracteres')
    }

    if (data.documento !== undefined && data.documento.trim().length < 5) {
      throw new Error('El documento debe tener al menos 5 caracteres')
    }

    if (data.cargo !== undefined && data.cargo.trim().length < 3) {
      throw new Error('El cargo debe tener al menos 3 caracteres')
    }

    if (data.direccion !== undefined && data.direccion.trim().length < 10) {
      throw new Error('La dirección debe tener al menos 10 caracteres')
    }

    // Validar formato de email si se proporciona
    if (data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw new Error('El formato del email es inválido')
      }

      // Verificar unicidad de email
      const emailExists = await TrabajadorModel.isEmailTaken(data.email, id)
      if (emailExists) {
        throw new Error('El email ya está registrado')
      }
    }

    // Validar documento si se proporciona
    if (data.documento !== undefined) {
      const documentoExists = await TrabajadorModel.isDocumentoTaken(data.documento, id)
      if (documentoExists) {
        throw new Error('El documento ya está registrado')
      }
    }

    // Validar formato de fecha si se proporciona
    if (data.fecha_ingreso !== undefined) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!fechaRegex.test(data.fecha_ingreso)) {
        throw new Error('El formato de fecha debe ser YYYY-MM-DD')
      }

      // Validar que la fecha no sea futura
      const fechaIngreso = new Date(data.fecha_ingreso)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      if (fechaIngreso > hoy) {
        throw new Error('La fecha de ingreso no puede ser futura')
      }
    }

    // Actualizar
    const updated = await TrabajadorModel.update(id, data)
    
    if (!updated) {
      throw new Error('No se pudo actualizar el trabajador')
    }

    // Obtener el trabajador actualizado
    const trabajador = await TrabajadorModel.findById(id)
    
    if (!trabajador) {
      throw new Error('Error al obtener el trabajador actualizado')
    }
    
    return trabajador
  }

  /**
   * Eliminar un trabajador
   */
  async deleteTrabajador(id: number): Promise<void> {
    // Verificar que el trabajador existe
    const exists = await TrabajadorModel.exists(id)
    if (!exists) {
      throw new Error('Trabajador no encontrado')
    }

    // Eliminar trabajador
    await TrabajadorModel.delete(id)
  }
}

export const trabajadoresService = new TrabajadoresService()

