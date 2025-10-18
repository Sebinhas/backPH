import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  id: number;
  email: string;
  rol: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '7d' }
  );
};

export const generateResetToken = (userId: number): string => {
  return jwt.sign(
    { id: userId, type: 'reset' },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '1h' }
  );
};

export const verifyResetToken = (token: string): { id: number } | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as { id: number; type: string };
    
    if (decoded.type === 'reset') {
      return { id: decoded.id };
    }
    return null;
  } catch (error) {
    return null;
  }
};

