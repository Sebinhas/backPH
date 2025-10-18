import { Router } from 'express';
import { RolesController } from '../controllers/roles.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/roles
router.get('/', RolesController.getRoles);

// GET /api/roles/:id
router.get('/:id', RolesController.getRol);

// POST /api/roles
router.post('/', RolesController.createRol);

// PUT /api/roles/:id
router.put('/:id', RolesController.updateRol);

// DELETE /api/roles/:id
router.delete('/:id', RolesController.deleteRol);

export default router;

