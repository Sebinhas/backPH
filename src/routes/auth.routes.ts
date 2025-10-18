import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  loginValidation,
  registerValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../middlewares/validation';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', loginValidation, AuthController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', registerValidation, AuthController.register);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar recuperación de contraseña
 * @access  Public
 */
router.post('/forgot-password', forgotPasswordValidation, AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con token
 * @access  Public
 */
router.post('/reset-password', resetPasswordValidation, AuthController.resetPassword);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar token de autenticación
 * @access  Private
 */
router.get('/verify', authMiddleware, AuthController.verifyToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', authMiddleware, AuthController.logout);

export default router;

