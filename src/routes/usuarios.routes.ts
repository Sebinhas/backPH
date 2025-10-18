import { Router } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/usuarios/estadisticas
router.get('/estadisticas', UsuariosController.getEstadisticas);

// GET /api/usuarios
router.get('/', UsuariosController.getUsuarios);

// GET /api/usuarios/:id
router.get('/:id', UsuariosController.getUsuario);

// POST /api/usuarios
router.post('/', UsuariosController.createUsuario);

// PUT /api/usuarios/:id
router.put('/:id', UsuariosController.updateUsuario);

// DELETE /api/usuarios/:id
router.delete('/:id', UsuariosController.deleteUsuario);

export default router;

