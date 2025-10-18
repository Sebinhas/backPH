import { Request, Response, NextFunction } from 'express'
import { trabajadoresService } from '../services/trabajadores.service'
import { CreateTrabajadorDto, UpdateTrabajadorDto } from '../models/trabajador.model'

// ============================================================================
// CONTROLLER DE TRABAJADORES
// ============================================================================

export class TrabajadoresController {
  /**
   * GET /api/trabajadores
   * Obtener todos los trabajadores
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const trabajadores = await trabajadoresService.getAllTrabajadores()
      res.json(trabajadores)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/trabajadores/:id
   * Obtener un trabajador por ID
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

      const trabajador = await trabajadoresService.getTrabajadorById(id)
      res.json(trabajador)
    } catch (error) {
      if (error instanceof Error && error.message === 'Trabajador no encontrado') {
        return res.status(404).json({ 
          error: 'Trabajador no encontrado',
          message: 'No existe un trabajador con el ID proporcionado'
        })
      }
      next(error)
    }
  }

  /**
   * GET /api/trabajadores/search?q={query}
   * Buscar trabajadores
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string || ''
      
      const trabajadores = await trabajadoresService.searchTrabajadores(query)
      res.json(trabajadores)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/trabajadores
   * Crear un nuevo trabajador
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateTrabajadorDto = req.body

      const trabajador = await trabajadoresService.createTrabajador(data)
      
      res.status(201).json(trabajador)
    } catch (error) {
      if (error instanceof Error) {
        // Errores de validación o duplicados
        if (error.message.includes('ya está registrado')) {
          return res.status(409).json({ 
            error: 'Validación fallida',
            message: error.message,
            fields: error.message.includes('email') 
              ? { email: 'Este email ya está registrado' }
              : { documento: 'Este documento ya está registrado' }
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
   * PUT /api/trabajadores/:id
   * Actualizar un trabajador
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

      const data: UpdateTrabajadorDto = req.body

      const trabajador = await trabajadoresService.updateTrabajador(id, data)
      
      res.json(trabajador)
    } catch (error) {
      if (error instanceof Error && error.message === 'Trabajador no encontrado') {
        return res.status(404).json({ 
          error: 'Trabajador no encontrado',
          message: 'No existe un trabajador con el ID proporcionado'
        })
      }
      if (error instanceof Error) {
        // Errores de validación o duplicados
        if (error.message.includes('ya está registrado')) {
          return res.status(409).json({ 
            error: 'Validación fallida',
            message: error.message,
            fields: error.message.includes('email') 
              ? { email: 'Este email ya está registrado' }
              : { documento: 'Este documento ya está registrado' }
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
   * DELETE /api/trabajadores/:id
   * Eliminar un trabajador
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

      await trabajadoresService.deleteTrabajador(id)
      
      res.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Trabajador no encontrado') {
        return res.status(404).json({ 
          error: 'Trabajador no encontrado',
          message: 'No existe un trabajador con el ID proporcionado'
        })
      }
      next(error)
    }
  }
}

export const trabajadoresController = new TrabajadoresController()

