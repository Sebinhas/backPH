import { 
  PlanificacionModel, 
  ActividadPlanificada, 
  CreateActividadDto, 
  UpdateActividadDto,
  EstadoActividad
} from '../models/planificacion.model'

// ============================================================================
// SERVICIO DE PLANIFICACIÓN
// ============================================================================

export class PlanificacionService {
  /**
   * Obtener todas las actividades
   */
  async getAllActividades(): Promise<ActividadPlanificada[]> {
    const actividades = await PlanificacionModel.findAll()
    
    // Actualizar estados y desviaciones
    for (const actividad of actividades) {
      await this.actualizarEstadoAutomatico(actividad)
    }
    
    return actividades
  }

  /**
   * Obtener una actividad por ID
   */
  async getActividadById(id: number): Promise<ActividadPlanificada> {
    const actividad = await PlanificacionModel.findById(id)
    
    if (!actividad) {
      throw new Error('Actividad no encontrada')
    }
    
    await this.actualizarEstadoAutomatico(actividad)
    
    return actividad
  }

  /**
   * Crear una nueva actividad
   */
  async createActividad(data: CreateActividadDto, userId: number | null): Promise<ActividadPlanificada> {
    // Validaciones
    if (!data.nombre || data.nombre.trim().length === 0) {
      throw new Error('El nombre de la actividad es requerido')
    }

    if (!data.descripcion || data.descripcion.trim().length === 0) {
      throw new Error('La descripción es requerida')
    }

    if (!data.fecha_inicio_planificada || !data.fecha_fin_planificada) {
      throw new Error('Las fechas de inicio y fin son requeridas')
    }

    if (new Date(data.fecha_fin_planificada) <= new Date(data.fecha_inicio_planificada)) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio')
    }

    if (!data.duracion_estimada_horas || data.duracion_estimada_horas <= 0) {
      throw new Error('La duración estimada debe ser mayor a 0')
    }

    // Crear actividad
    const id = await PlanificacionModel.create(data, userId)
    
    // Obtener la actividad creada
    const actividad = await PlanificacionModel.findById(id)
    
    if (!actividad) {
      throw new Error('Error al crear la actividad')
    }
    
    return actividad
  }

  /**
   * Actualizar una actividad
   */
  async updateActividad(id: number, data: UpdateActividadDto): Promise<ActividadPlanificada> {
    // Verificar que existe
    const exists = await PlanificacionModel.exists(id)
    if (!exists) {
      throw new Error('Actividad no encontrada')
    }

    // Validaciones
    if (data.nombre !== undefined && data.nombre.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío')
    }

    if (data.fecha_inicio_planificada && data.fecha_fin_planificada) {
      if (new Date(data.fecha_fin_planificada) <= new Date(data.fecha_inicio_planificada)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio')
      }
    }

    if (data.progreso_porcentaje !== undefined) {
      if (data.progreso_porcentaje < 0 || data.progreso_porcentaje > 100) {
        throw new Error('El progreso debe estar entre 0 y 100')
      }
    }

    // Actualizar
    const updated = await PlanificacionModel.update(id, data)
    
    if (!updated) {
      throw new Error('No se pudo actualizar la actividad')
    }

    // Obtener la actividad actualizada
    const actividad = await PlanificacionModel.findById(id)
    
    if (!actividad) {
      throw new Error('Error al obtener la actividad actualizada')
    }
    
    // Recalcular estado y desviaciones
    await this.actualizarEstadoAutomatico(actividad)
    
    return actividad
  }

  /**
   * Eliminar una actividad
   */
  async deleteActividad(id: number): Promise<void> {
    const exists = await PlanificacionModel.exists(id)
    if (!exists) {
      throw new Error('Actividad no encontrada')
    }

    await PlanificacionModel.delete(id)
  }

  /**
   * Obtener estadísticas
   */
  async getEstadisticas(): Promise<any> {
    return await PlanificacionModel.getEstadisticas()
  }

  /**
   * Obtener actividades de un lote
   */
  async getActividadesPorLote(loteId: number): Promise<ActividadPlanificada[]> {
    const actividades = await PlanificacionModel.findByLote(loteId)
    
    for (const actividad of actividades) {
      await this.actualizarEstadoAutomatico(actividad)
    }
    
    return actividades
  }

  /**
   * Actualizar el estado de una actividad automáticamente
   * basándose en fechas y progreso
   */
  private async actualizarEstadoAutomatico(actividad: ActividadPlanificada): Promise<void> {
    const hoy = new Date()
    const fechaInicio = new Date(actividad.fecha_inicio_planificada)
    const fechaFin = new Date(actividad.fecha_fin_planificada)

    // Calcular desviación de tiempo
    if (actividad.fecha_inicio_real) {
      const fechaFinReal = actividad.fecha_fin_real || hoy
      const diasDiferencia = Math.ceil(
        (fechaFinReal.getTime() - fechaFin.getTime()) / (1000 * 60 * 60 * 24)
      )
      actividad.desviacion_tiempo_dias = diasDiferencia
    }

    // Determinar estado automático
    let nuevoEstado = actividad.estado

    if (actividad.progreso_porcentaje === 100) {
      nuevoEstado = EstadoActividad.COMPLETADA
    } else if (hoy > fechaFin && actividad.progreso_porcentaje < 100) {
      nuevoEstado = EstadoActividad.ATRASADA
      actividad.requiere_atencion = true
    } else if (hoy >= fechaInicio && hoy <= fechaFin && actividad.progreso_porcentaje > 0) {
      nuevoEstado = EstadoActividad.EN_PROGRESO
    } else if (hoy < fechaInicio) {
      nuevoEstado = EstadoActividad.PENDIENTE
    }

    // Actualizar si cambió el estado
    if (nuevoEstado !== actividad.estado) {
      await PlanificacionModel.update(actividad.id, { estado: nuevoEstado })
      actividad.estado = nuevoEstado
    }

    // Actualizar metas con porcentaje de cumplimiento
    if (actividad.metas) {
      for (const meta of actividad.metas) {
        if (meta.valor_objetivo > 0) {
          meta.porcentaje_cumplimiento = Math.min(
            100,
            Math.round((meta.valor_actual / meta.valor_objetivo) * 100)
          )
          meta.cumplida = meta.valor_actual >= meta.valor_objetivo
        }
      }
    }
  }

  /**
   * Actualizar progreso de una actividad
   */
  async updateProgreso(id: number, data: any): Promise<ActividadPlanificada> {
    const actividad = await this.getActividadById(id)
    
    const updateData: UpdateActividadDto = {
      progreso_porcentaje: data.progreso_porcentaje,
      fecha_inicio_real: data.fecha_inicio_real,
      fecha_fin_real: data.fecha_fin_real,
      duracion_real_horas: data.duracion_real_horas
    }

    // Actualizar estado basado en el progreso
    if (data.progreso_porcentaje === 100) {
      updateData.estado = EstadoActividad.COMPLETADA
    } else if (data.progreso_porcentaje > 0) {
      updateData.estado = EstadoActividad.EN_PROGRESO
    }

    const success = await PlanificacionModel.update(id, updateData)
    
    if (!success) {
      throw new Error('No se pudo actualizar el progreso de la actividad')
    }

    return await this.getActividadById(id)
  }
}

export const planificacionService = new PlanificacionService()

