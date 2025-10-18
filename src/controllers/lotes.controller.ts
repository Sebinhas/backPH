import { Request, Response, NextFunction } from 'express'
import { lotesService } from '../services/lotes.service'
import { CreateLoteDto, UpdateLoteDto } from '../models/lote.model'

// ============================================================================
// CONTROLLER DE LOTES
// ============================================================================

export class LotesController {
  /**
   * GET /api/lotes
   * Obtener todos los lotes
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const lotes = await lotesService.getAllLotes()
      res.json(lotes)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/lotes/estadisticas
   * Obtener estadísticas de lotes
   */
  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const estadisticas = await lotesService.getEstadisticas()
      res.json(estadisticas)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/lotes/:id
   * Obtener un lote por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      const lote = await lotesService.getLoteById(id)
      res.json(lote)
    } catch (error) {
      if (error instanceof Error && error.message === 'Lote no encontrado') {
        return res.status(404).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * POST /api/lotes
   * Crear un nuevo lote
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateLoteDto = req.body

      const lote = await lotesService.createLote(data)
      
      res.status(201).json(lote)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * PUT /api/lotes/:id
   * Actualizar un lote
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      const data: UpdateLoteDto = req.body

      const lote = await lotesService.updateLote(id, data)
      
      res.json(lote)
    } catch (error) {
      if (error instanceof Error && error.message === 'Lote no encontrado') {
        return res.status(404).json({ message: error.message })
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * DELETE /api/lotes/:id
   * Eliminar un lote
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      await lotesService.deleteLote(id)
      
      res.json({ message: 'Lote eliminado correctamente' })
    } catch (error) {
      if (error instanceof Error && error.message === 'Lote no encontrado') {
        return res.status(404).json({ message: error.message })
      }
      next(error)
    }
  }
}

export const lotesController = new LotesController()

