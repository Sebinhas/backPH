import { Router } from 'express'
import { laboresController } from '../controllers/labores.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// GET /api/labores/search - Buscar labores (debe ir antes de /:id)
router.get('/search', laboresController.search.bind(laboresController))

// GET /api/labores/fecha-rango - Obtener labores por rango de fechas (debe ir antes de /:id)
router.get('/fecha-rango', laboresController.getByDateRange.bind(laboresController))

// GET /api/labores/estadisticas - Obtener estadísticas (debe ir antes de /:id)
router.get('/estadisticas', laboresController.getEstadisticas.bind(laboresController))

// GET /api/labores/trabajador/:trabajadorId - Obtener labores por trabajador (debe ir antes de /:id)
router.get('/trabajador/:trabajadorId', laboresController.getByTrabajador.bind(laboresController))

// GET /api/labores - Obtener todas las labores
router.get('/', laboresController.getAll.bind(laboresController))

// GET /api/labores/:id - Obtener una labor específica
router.get('/:id', laboresController.getById.bind(laboresController))

// POST /api/labores - Crear nueva labor
router.post('/', laboresController.create.bind(laboresController))

// PUT /api/labores/:id - Actualizar labor
router.put('/:id', laboresController.update.bind(laboresController))

// DELETE /api/labores/:id - Eliminar labor
router.delete('/:id', laboresController.delete.bind(laboresController))

export default router

