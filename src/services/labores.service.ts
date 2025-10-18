import { 
  LaborModel, 
  Labor, 
  CreateLaborDto, 
  UpdateLaborDto 
} from '../models/labor.model'

// ============================================================================
// SERVICIO DE LABORES AGRÍCOLAS
// ============================================================================

export class LaboresService {
  /**
   * Obtener todas las labores
   */
  async getAllLabores(): Promise<Labor[]> {
    return await LaborModel.findAll()
  }

  /**
   * Obtener una labor por ID
   */
  async getLaborById(id: number): Promise<Labor> {
    const labor = await LaborModel.findById(id)
    
    if (!labor) {
      throw new Error('Labor no encontrada')
    }
    
    return labor
  }

  /**
   * Buscar labores
   */
  async searchLabores(query: string): Promise<Labor[]> {
    if (!query || query.trim().length === 0) {
      return await this.getAllLabores()
    }
    
    return await LaborModel.search(query.trim())
  }

  /**
   * Obtener labores por rango de fechas
   */
  async getLaboresByDateRange(fechaInicio: string, fechaFin: string): Promise<Labor[]> {
    return await LaborModel.findByDateRange(fechaInicio, fechaFin)
  }

  /**
   * Obtener labores por trabajador
   */
  async getLaboresByTrabajador(trabajadorId: number): Promise<Labor[]> {
    return await LaborModel.findByTrabajador(trabajadorId)
  }

  /**
   * Obtener estadísticas de labores
   */
  async getEstadisticasLabores() {
    return await LaborModel.getEstadisticas()
  }

  /**
   * Calcular métricas de una labor
   */
  private calcularMetricas(horaInicio: string, horaFin: string, cantidadRecolectada: number) {
    // Convertir horas a minutos
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number)
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number)
    
    const minutosInicio = horaInicioH * 60 + horaInicioM
    const minutosFin = horaFinH * 60 + horaFinM
    
    const duracionMinutos = minutosFin - minutosInicio
    const duracionHoras = duracionMinutos / 60
    
    const rendimientoPorHora = duracionHoras > 0 ? cantidadRecolectada / duracionHoras : 0
    const costoEstimado = duracionMinutos * 0.5 // $0.5 por minuto
    
    return {
      duracionMinutos,
      rendimientoPorHora: Math.round(rendimientoPorHora * 100) / 100,
      costoEstimado: Math.round(costoEstimado * 100) / 100
    }
  }

  /**
   * Crear una nueva labor
   */
  async createLabor(data: CreateLaborDto): Promise<Labor> {
    // Validaciones
    if (!data.fecha || data.fecha.trim().length === 0) {
      throw new Error('La fecha es requerida')
    }

    if (!data.cultivo || data.cultivo.trim().length === 0) {
      throw new Error('El cultivo es requerido')
    }

    if (!data.lote || data.lote.trim().length === 0) {
      throw new Error('El lote es requerido')
    }

    if (!data.trabajador_id || data.trabajador_id <= 0) {
      throw new Error('El trabajador es requerido')
    }

    if (!data.tipo_labor_id || data.tipo_labor_id <= 0) {
      throw new Error('El tipo de labor es requerido')
    }

    if (data.cantidad_recolectada < 0) {
      throw new Error('La cantidad recolectada no puede ser negativa')
    }

    if (data.peso_total < 0) {
      throw new Error('El peso total no puede ser negativo')
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!fechaRegex.test(data.fecha)) {
      throw new Error('El formato de fecha debe ser YYYY-MM-DD')
    }

    // Validar que la fecha no sea futura
    const fechaLabor = new Date(data.fecha)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    if (fechaLabor > hoy) {
      throw new Error('La fecha de labor no puede ser futura')
    }

    // Validar formato de horas (HH:mm)
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!horaRegex.test(data.hora_inicio) || !horaRegex.test(data.hora_fin)) {
      throw new Error('El formato de horas debe ser HH:mm')
    }

    // Validar que hora_fin sea posterior a hora_inicio
    const [horaInicioH, horaInicioM] = data.hora_inicio.split(':').map(Number)
    const [horaFinH, horaFinM] = data.hora_fin.split(':').map(Number)
    
    const minutosInicio = horaInicioH * 60 + horaInicioM
    const minutosFin = horaFinH * 60 + horaFinM
    
    if (minutosFin <= minutosInicio) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio')
    }

    // Validar coordenadas GPS
    if (!data.ubicacion_gps || 
        typeof data.ubicacion_gps.latitud !== 'number' || 
        typeof data.ubicacion_gps.longitud !== 'number') {
      throw new Error('La ubicación GPS es requerida')
    }

    if (data.ubicacion_gps.latitud < -90 || data.ubicacion_gps.latitud > 90) {
      throw new Error('La latitud debe estar entre -90 y 90')
    }

    if (data.ubicacion_gps.longitud < -180 || data.ubicacion_gps.longitud > 180) {
      throw new Error('La longitud debe estar entre -180 y 180')
    }

    // Validar condiciones climáticas si se proporcionan
    if (data.condiciones_climaticas) {
      if (data.condiciones_climaticas.humedad !== undefined && 
          (data.condiciones_climaticas.humedad < 0 || data.condiciones_climaticas.humedad > 100)) {
        throw new Error('La humedad debe estar entre 0 y 100')
      }
    }

    // Calcular métricas
    const metricas = this.calcularMetricas(data.hora_inicio, data.hora_fin, data.cantidad_recolectada)

    // Crear labor
    const id = await LaborModel.create(data, metricas)
    
    // Obtener la labor creada
    const labor = await LaborModel.findById(id)
    
    if (!labor) {
      throw new Error('Error al crear la labor')
    }
    
    return labor
  }

  /**
   * Actualizar una labor
   */
  async updateLabor(id: number, data: UpdateLaborDto): Promise<Labor> {
    // Verificar que la labor existe
    const exists = await LaborModel.exists(id)
    if (!exists) {
      throw new Error('Labor no encontrada')
    }

    // Validaciones
    if (data.fecha !== undefined) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!fechaRegex.test(data.fecha)) {
        throw new Error('El formato de fecha debe ser YYYY-MM-DD')
      }

      const fechaLabor = new Date(data.fecha)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      if (fechaLabor > hoy) {
        throw new Error('La fecha de labor no puede ser futura')
      }
    }

    if (data.cantidad_recolectada !== undefined && data.cantidad_recolectada < 0) {
      throw new Error('La cantidad recolectada no puede ser negativa')
    }

    if (data.peso_total !== undefined && data.peso_total < 0) {
      throw new Error('El peso total no puede ser negativo')
    }

    if (data.hora_inicio !== undefined || data.hora_fin !== undefined) {
      const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      
      if (data.hora_inicio && !horaRegex.test(data.hora_inicio)) {
        throw new Error('El formato de hora de inicio debe ser HH:mm')
      }
      
      if (data.hora_fin && !horaRegex.test(data.hora_fin)) {
        throw new Error('El formato de hora de fin debe ser HH:mm')
      }

      // Si se actualizan ambas horas, validar que hora_fin sea posterior a hora_inicio
      if (data.hora_inicio && data.hora_fin) {
        const [horaInicioH, horaInicioM] = data.hora_inicio.split(':').map(Number)
        const [horaFinH, horaFinM] = data.hora_fin.split(':').map(Number)
        
        const minutosInicio = horaInicioH * 60 + horaInicioM
        const minutosFin = horaFinH * 60 + horaFinM
        
        if (minutosFin <= minutosInicio) {
          throw new Error('La hora de fin debe ser posterior a la hora de inicio')
        }
      }
    }

    if (data.ubicacion_gps !== undefined) {
      if (typeof data.ubicacion_gps.latitud !== 'number' || 
          typeof data.ubicacion_gps.longitud !== 'number') {
        throw new Error('La ubicación GPS debe tener latitud y longitud válidas')
      }

      if (data.ubicacion_gps.latitud < -90 || data.ubicacion_gps.latitud > 90) {
        throw new Error('La latitud debe estar entre -90 y 90')
      }

      if (data.ubicacion_gps.longitud < -180 || data.ubicacion_gps.longitud > 180) {
        throw new Error('La longitud debe estar entre -180 y 180')
      }
    }

    if (data.condiciones_climaticas !== undefined) {
      if (data.condiciones_climaticas.humedad !== undefined && 
          (data.condiciones_climaticas.humedad < 0 || data.condiciones_climaticas.humedad > 100)) {
        throw new Error('La humedad debe estar entre 0 y 100')
      }
    }

    // Calcular métricas si se actualizan campos relevantes
    let metricas = undefined
    if (data.hora_inicio !== undefined || data.hora_fin !== undefined || data.cantidad_recolectada !== undefined) {
      // Obtener la labor actual para usar valores no actualizados
      const laborActual = await LaborModel.findById(id)
      if (laborActual) {
        const horaInicio = data.hora_inicio || laborActual.hora_inicio
        const horaFin = data.hora_fin || laborActual.hora_fin
        const cantidad = data.cantidad_recolectada !== undefined ? data.cantidad_recolectada : laborActual.cantidad_recolectada
        
        metricas = this.calcularMetricas(horaInicio, horaFin, cantidad)
      }
    }

    // Actualizar
    const updated = await LaborModel.update(id, data, metricas)
    
    if (!updated) {
      throw new Error('No se pudo actualizar la labor')
    }

    // Obtener la labor actualizada
    const labor = await LaborModel.findById(id)
    
    if (!labor) {
      throw new Error('Error al obtener la labor actualizada')
    }
    
    return labor
  }

  /**
   * Eliminar una labor
   */
  async deleteLabor(id: number): Promise<void> {
    // Verificar que la labor existe
    const exists = await LaborModel.exists(id)
    if (!exists) {
      throw new Error('Labor no encontrada')
    }

    // Eliminar labor
    await LaborModel.delete(id)
  }
}

export const laboresService = new LaboresService()

