import { Router } from 'express'
import { trabajadoresController } from '../controllers/trabajadores.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// GET /api/trabajadores/search - Buscar trabajadores (debe ir antes de /:id)
router.get('/search', trabajadoresController.search.bind(trabajadoresController))

// GET /api/trabajadores - Obtener todos los trabajadores
router.get('/', trabajadoresController.getAll.bind(trabajadoresController))

// GET /api/trabajadores/:id - Obtener un trabajador específico
router.get('/:id', trabajadoresController.getById.bind(trabajadoresController))

// POST /api/trabajadores - Crear nuevo trabajador
router.post('/', trabajadoresController.create.bind(trabajadoresController))

// PUT /api/trabajadores/:id - Actualizar trabajador
router.put('/:id', trabajadoresController.update.bind(trabajadoresController))

// DELETE /api/trabajadores/:id - Eliminar trabajador
router.delete('/:id', trabajadoresController.delete.bind(trabajadoresController))

export default router

