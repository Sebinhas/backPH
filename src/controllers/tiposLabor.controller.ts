import { Request, Response, NextFunction } from 'express'
import { tiposLaborService } from '../services/tiposLabor.service'
import { CreateTipoLaborDto, UpdateTipoLaborDto } from '../models/tipoLabor.model'

// ============================================================================
// CONTROLLER DE TIPOS DE LABOR
// ============================================================================

export class TiposLaborController {
  /**
   * GET /api/tipos-labor
   * Obtener todos los tipos de labor
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tiposLabor = await tiposLaborService.getAllTiposLabor()
      res.json(tiposLabor)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/tipos-labor/:id
   * Obtener un tipo de labor por ID
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

      const tipoLabor = await tiposLaborService.getTipoLaborById(id)
      res.json(tipoLabor)
    } catch (error) {
      if (error instanceof Error && error.message === 'Tipo de labor no encontrado') {
        return res.status(404).json({ 
          error: 'Tipo de labor no encontrado',
          message: 'No existe un tipo de labor con el ID proporcionado'
        })
      }
      next(error)
    }
  }

  /**
   * GET /api/tipos-labor/search?q={query}
   * Buscar tipos de labor
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string || ''
      
      const tiposLabor = await tiposLaborService.searchTiposLabor(query)
      res.json(tiposLabor)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/tipos-labor
   * Crear un nuevo tipo de labor
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateTipoLaborDto = req.body

      const tipoLabor = await tiposLaborService.createTipoLabor(data)
      
      res.status(201).json(tipoLabor)
    } catch (error) {
      if (error instanceof Error) {
        // Error de nombre duplicado
        if (error.message.includes('Ya existe un tipo de labor')) {
          return res.status(400).json({ 
            error: 'Validación fallida',
            message: error.message,
            fields: { nombre: 'Este nombre ya está registrado' }
          })
        }
        
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: error.message 
        })
      }
      next(error)
    }
  }

  /**
   * PUT /api/tipos-labor/:id
   * Actualizar un tipo de labor
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

      const data: UpdateTipoLaborDto = req.body

      const tipoLabor = await tiposLaborService.updateTipoLabor(id, data)
      
      res.json(tipoLabor)
    } catch (error) {
      if (error instanceof Error && error.message === 'Tipo de labor no encontrado') {
        return res.status(404).json({ 
          error: 'Tipo de labor no encontrado',
          message: 'No existe un tipo de labor con el ID proporcionado'
        })
      }
      if (error instanceof Error) {
        // Error de nombre duplicado
        if (error.message.includes('Ya existe un tipo de labor')) {
          return res.status(400).json({ 
            error: 'Validación fallida',
            message: error.message
          })
        }
        
        return res.status(400).json({ 
          error: 'Validación fallida',
          message: error.message 
        })
      }
      next(error)
    }
  }

  /**
   * DELETE /api/tipos-labor/:id
   * Eliminar un tipo de labor
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

      await tiposLaborService.deleteTipoLabor(id)
      
      res.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Tipo de labor no encontrado') {
        return res.status(404).json({ 
          error: 'Tipo de labor no encontrado',
          message: 'No existe un tipo de labor con el ID proporcionado'
        })
      }
      if (error instanceof Error && error.message.includes('está siendo usado')) {
        return res.status(400).json({ 
          error: 'Operación no permitida',
          message: error.message 
        })
      }
      next(error)
    }
  }
}

export const tiposLaborController = new TiposLaborController()

