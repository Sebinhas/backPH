import { Router } from 'express'
import { planificacionController } from '../controllers/planificacion.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// GET /api/planificacion/estadisticas - Estadísticas (antes de /:id)
router.get('/estadisticas', planificacionController.getEstadisticas.bind(planificacionController))

// GET /api/planificacion/lote/:loteId - Actividades por lote (antes de /:id)
router.get('/lote/:loteId', planificacionController.getByLote.bind(planificacionController))

// GET /api/planificacion - Obtener todas las actividades
router.get('/', planificacionController.getAll.bind(planificacionController))

// GET /api/planificacion/:id - Obtener una actividad específica
router.get('/:id', planificacionController.getById.bind(planificacionController))

// POST /api/planificacion - Crear nueva actividad
router.post('/', planificacionController.create.bind(planificacionController))

// PUT /api/planificacion/:id - Actualizar actividad
router.put('/:id', planificacionController.update.bind(planificacionController))

// PUT /api/planificacion/:id/progreso - Actualizar progreso de actividad
router.put('/:id/progreso', planificacionController.updateProgreso.bind(planificacionController))

// DELETE /api/planificacion/:id - Eliminar actividad
router.delete('/:id', planificacionController.delete.bind(planificacionController))

export default router

