import { Router } from 'express'
import { lotesController } from '../controllers/lotes.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// GET /api/lotes/estadisticas - Estadísticas (debe ir antes de /:id)
router.get('/estadisticas', lotesController.getEstadisticas.bind(lotesController))

// GET /api/lotes - Obtener todos los lotes
router.get('/', lotesController.getAll.bind(lotesController))

// GET /api/lotes/:id - Obtener un lote específico
router.get('/:id', lotesController.getById.bind(lotesController))

// POST /api/lotes - Crear nuevo lote
router.post('/', lotesController.create.bind(lotesController))

// PUT /api/lotes/:id - Actualizar lote
router.put('/:id', lotesController.update.bind(lotesController))

// DELETE /api/lotes/:id - Eliminar lote
router.delete('/:id', lotesController.delete.bind(lotesController))

export default router

