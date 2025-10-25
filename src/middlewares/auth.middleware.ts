import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface JwtPayload {
  id: number;
  email: string;
  rol: string;
}

// Extender Request de Express
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.substring(7);

    // Verificar si el token está en la lista negra
    const blacklistedResult = await pool.query(
      'SELECT id FROM token_blacklist WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (blacklistedResult.rows.length > 0) {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as JwtPayload;

    // Verificar que el usuario aún exista
    const usersResult = await pool.query(
      'SELECT id, email, rol FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    if (usersResult.rows.length === 0) {
      res.status(401).json({ message: 'Usuario no encontrado' });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol as 'usuario' | 'admin'
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expirado' });
      return;
    }
    res.status(500).json({ message: 'Error al verificar token' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const adminRoles = ['admin', 'Administrador', 'administrador'];
  if (!req.user?.rol || !adminRoles.includes(req.user.rol)) {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador' });
    return;
  }
  next();
};

// Alias para mantener compatibilidad
export const authMiddleware = authenticateToken;

