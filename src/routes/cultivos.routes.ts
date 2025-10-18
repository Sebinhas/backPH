import { Router } from 'express'
import { cultivosController } from '../controllers/cultivos.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// GET /api/cultivos - Obtener todos los cultivos
router.get('/', cultivosController.getAll.bind(cultivosController))

// GET /api/cultivos/activos - Obtener cultivos activos
router.get('/activos', cultivosController.getActive.bind(cultivosController))

// GET /api/cultivos/:id - Obtener un cultivo específico
router.get('/:id', cultivosController.getById.bind(cultivosController))

// POST /api/cultivos - Crear nuevo cultivo
router.post('/', cultivosController.create.bind(cultivosController))

// PUT /api/cultivos/:id - Actualizar cultivo
router.put('/:id', cultivosController.update.bind(cultivosController))

// DELETE /api/cultivos/:id - Eliminar cultivo
router.delete('/:id', cultivosController.delete.bind(cultivosController))

export default router

