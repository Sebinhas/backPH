import { Request, Response, NextFunction } from 'express'
import { planificacionService } from '../services/planificacion.service'
import { CreateActividadDto, UpdateActividadDto } from '../models/planificacion.model'

// ============================================================================
// CONTROLLER DE PLANIFICACIÓN
// ============================================================================

export class PlanificacionController {
  /**
   * GET /api/planificacion
   * Obtener todas las actividades
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const actividades = await planificacionService.getAllActividades()
      res.json(actividades)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/planificacion/estadisticas
   * Obtener estadísticas
   */
  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const estadisticas = await planificacionService.getEstadisticas()
      res.json(estadisticas)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/planificacion/lote/:loteId
   * Obtener actividades de un lote específico
   */
  async getByLote(req: Request, res: Response, next: NextFunction) {
    try {
      const loteId = parseInt(req.params.loteId)
      
      if (isNaN(loteId)) {
        return res.status(400).json({ message: 'ID de lote inválido' })
      }

      const actividades = await planificacionService.getActividadesPorLote(loteId)
      res.json(actividades)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/planificacion/:id
   * Obtener una actividad por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      const actividad = await planificacionService.getActividadById(id)
      res.json(actividad)
    } catch (error) {
      if (error instanceof Error && error.message === 'Actividad no encontrada') {
        return res.status(404).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * POST /api/planificacion
   * Crear una nueva actividad
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateActividadDto = req.body
      // Obtener el ID del usuario autenticado, o null si no hay sesión
      const userId = (req as any).user?.id || null

      const actividad = await planificacionService.createActividad(data, userId)
      
      res.status(201).json(actividad)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * PUT /api/planificacion/:id
   * Actualizar una actividad
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      const data: UpdateActividadDto = req.body

      const actividad = await planificacionService.updateActividad(id, data)
      
      res.json(actividad)
    } catch (error) {
      if (error instanceof Error && error.message === 'Actividad no encontrada') {
        return res.status(404).json({ message: error.message })
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * PUT /api/planificacion/:id/progreso
   * Actualizar progreso de una actividad
   */
  async updateProgreso(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      const data = req.body
      const actividad = await planificacionService.updateProgreso(id, data)
      
      res.json(actividad)
    } catch (error) {
      if (error instanceof Error && error.message === 'Actividad no encontrada') {
        return res.status(404).json({ message: error.message })
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * DELETE /api/planificacion/:id
   * Eliminar una actividad
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      await planificacionService.deleteActividad(id)
      
      res.json({ message: 'Actividad eliminada correctamente' })
    } catch (error) {
      if (error instanceof Error && error.message === 'Actividad no encontrada') {
        return res.status(404).json({ message: error.message })
      }
      next(error)
    }
  }
}

export const planificacionController = new PlanificacionController()

