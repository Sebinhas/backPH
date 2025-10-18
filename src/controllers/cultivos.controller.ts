import { Request, Response, NextFunction } from 'express'
import { cultivosService } from '../services/cultivos.service'
import { CreateCultivoDto, UpdateCultivoDto } from '../models/cultivo.model'

// ============================================================================
// CONTROLLER DE CULTIVOS
// ============================================================================

export class CultivosController {
  /**
   * GET /api/cultivos
   * Obtener todos los cultivos
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const cultivos = await cultivosService.getAllCultivos()
      res.json(cultivos)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/cultivos/activos
   * Obtener solo cultivos activos
   */
  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const cultivos = await cultivosService.getActiveCultivos()
      res.json(cultivos)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/cultivos/:id
   * Obtener un cultivo por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      const cultivo = await cultivosService.getCultivoById(id)
      res.json(cultivo)
    } catch (error) {
      if (error instanceof Error && error.message === 'Cultivo no encontrado') {
        return res.status(404).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * POST /api/cultivos
   * Crear un nuevo cultivo
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateCultivoDto = req.body

      const cultivo = await cultivosService.createCultivo(data)
      
      res.status(201).json(cultivo)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * PUT /api/cultivos/:id
   * Actualizar un cultivo
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      const data: UpdateCultivoDto = req.body

      const cultivo = await cultivosService.updateCultivo(id, data)
      
      res.json(cultivo)
    } catch (error) {
      if (error instanceof Error && error.message === 'Cultivo no encontrado') {
        return res.status(404).json({ message: error.message })
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message })
      }
      next(error)
    }
  }

  /**
   * DELETE /api/cultivos/:id
   * Eliminar (soft delete) un cultivo
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id)
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' })
      }

      await cultivosService.deleteCultivo(id)
      
      res.json({ message: 'Cultivo eliminado correctamente' })
    } catch (error) {
      if (error instanceof Error && error.message === 'Cultivo no encontrado') {
        return res.status(404).json({ message: error.message })
      }
      next(error)
    }
  }
}

export const cultivosController = new CultivosController()

