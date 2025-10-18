import { Request, Response, NextFunction } from 'express'
import { laboresService } from '../services/labores.service'
import { CreateLaborDto, UpdateLaborDto } from '../models/labor.model'

// ============================================================================
// CONTROLLER DE LABORES AGRÍCOLAS
// ============================================================================

export class LaboresController {
  /**
   * GET /api/labores
   * Obtener todas las labores
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const labores = await laboresService.getAllLabores()
      res.json(labores)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/labores/:id
   * Obtener una labor por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: 'ID inválido' 
        })
      }

      const labor = await laboresService.getLaborById(id)
      res.json(labor)
    } catch (error) {
      if (error instanceof Error && error.message === 'Labor no encontrada') {
        return res.status(404).json({ 
          error: 'Labor no encontrada',
          message: 'No existe una labor con el ID proporcionado'
        })
      }
      next(error)
    }
  }

  /**
   * GET /api/labores/search?q={query}
   * Buscar labores
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string || ''
      
      const labores = await laboresService.searchLabores(query)
      res.json(labores)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/labores/fecha-rango?inicio={fechaInicio}&fin={fechaFin}
   * Obtener labores por rango de fechas
   */
  async getByDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { inicio, fin } = req.query
      
      if (!inicio || !fin) {
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: 'Los parámetros inicio y fin son requeridos' 
        })
      }

      const labores = await laboresService.getLaboresByDateRange(inicio as string, fin as string)
      res.json(labores)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/labores/trabajador/:trabajadorId
   * Obtener labores por trabajador
   */
  async getByTrabajador(req: Request, res: Response, next: NextFunction) {
    try {
      const trabajadorId = parseInt(req.params.trabajadorId)
      
      if (isNaN(trabajadorId)) {
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: 'ID de trabajador inválido' 
        })
      }

      const labores = await laboresService.getLaboresByTrabajador(trabajadorId)
      res.json(labores)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/labores/estadisticas
   * Obtener estadísticas de labores
   */
  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const estadisticas = await laboresService.getEstadisticasLabores()
      res.json(estadisticas)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/labores
   * Crear una nueva labor
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateLaborDto = req.body

      const labor = await laboresService.createLabor(data)
      
      res.status(201).json(labor)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: error.message 
        })
      }
      next(error)
    }
  }

  /**
   * PUT /api/labores/:id
   * Actualizar una labor
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: 'ID inválido' 
        })
      }

      const data: UpdateLaborDto = req.body

      const labor = await laboresService.updateLabor(id, data)
      
      res.json(labor)
    } catch (error) {
      if (error instanceof Error && error.message === 'Labor no encontrada') {
        return res.status(404).json({ 
          error: 'Labor no encontrada',
          message: 'No existe una labor con el ID proporcionado'
        })
      }
      if (error instanceof Error) {
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: error.message 
        })
      }
      next(error)
    }
  }

  /**
   * DELETE /api/labores/:id
   * Eliminar una labor
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: 'ID inválido' 
        })
      }

      await laboresService.deleteLabor(id)
      
      res.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Labor no encontrada') {
        return res.status(404).json({ 
          error: 'Labor no encontrada',
          message: 'No existe una labor con el ID proporcionado'
        })
      }
      next(error)
    }
  }
}

export const laboresController = new LaboresController()

