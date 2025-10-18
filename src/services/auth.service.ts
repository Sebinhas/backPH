import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { generateToken, generateResetToken, verifyResetToken } from '../utils/jwt.util';
import { sendResetPasswordEmail, sendWelcomeEmail } from '../utils/email.util';
import { ApiError } from '../middlewares/errorHandler';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyResponse
} from '../types';

export class AuthService {
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Buscar usuario
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Credenciales incorrectas');
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Credenciales incorrectas');
    }

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        avatar: user.avatar
      },
      token
    };
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const { nombre, email, password } = data;

    // Verificar si el email ya existe
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'El email ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await UserModel.create({
      nombre,
      email,
      password: hashedPassword,
      rol: 'usuario'
    });

    // Enviar email de bienvenida (no bloqueante)
    sendWelcomeEmail(email, nombre).catch(err => 
      console.error('Error enviando email de bienvenida:', err)
    );

    // Generar token
    const token = generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        avatar: user.avatar
      },
      token
    };
  }

  static async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const { email } = data;

    // Buscar usuario
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }

    // Generar token de reseteo
    const resetToken = generateResetToken(user.id);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en BD
    await UserModel.updateResetToken(user.id, resetToken, resetTokenExpiry);

    // Enviar email
    try {
      await sendResetPasswordEmail(email, resetToken);
    } catch (error) {
      throw new ApiError(500, 'Error al enviar el email de recuperación');
    }

    return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
  }

  static async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const { token, password } = data;

    // Verificar token
    const decoded = verifyResetToken(token);
    if (!decoded) {
      throw new ApiError(400, 'Token inválido o expirado');
    }

    // Buscar usuario por token
    const user = await UserModel.findByResetToken(token);
    if (!user) {
      throw new ApiError(400, 'Token inválido o expirado');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar contraseña y limpiar token
    await UserModel.updatePassword(user.id, hashedPassword);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  static async verifyToken(userId: number): Promise<VerifyResponse> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado');
    }

    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      avatar: user.avatar
    };
  }

  static async logout(token: string, userId: number): Promise<{ message: string }> {
    // Calcular expiración del token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Agregar token a la lista negra
    await UserModel.addTokenToBlacklist(token, userId, expiresAt);

    return { message: 'Sesión cerrada exitosamente' };
  }
}

