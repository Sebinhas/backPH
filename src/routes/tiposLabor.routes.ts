import { Router } from 'express'
import { tiposLaborController } from '../controllers/tiposLabor.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// GET /api/tipos-labor/search - Buscar tipos de labor (debe ir antes de /:id)
router.get('/search', tiposLaborController.search.bind(tiposLaborController))

// GET /api/tipos-labor - Obtener todos los tipos de labor
router.get('/', tiposLaborController.getAll.bind(tiposLaborController))

// GET /api/tipos-labor/:id - Obtener un tipo de labor específico
router.get('/:id', tiposLaborController.getById.bind(tiposLaborController))

// POST /api/tipos-labor - Crear nuevo tipo de labor
router.post('/', tiposLaborController.create.bind(tiposLaborController))

// PUT /api/tipos-labor/:id - Actualizar tipo de labor
router.put('/:id', tiposLaborController.update.bind(tiposLaborController))

// DELETE /api/tipos-labor/:id - Eliminar tipo de labor
router.delete('/:id', tiposLaborController.delete.bind(tiposLaborController))

export default router

