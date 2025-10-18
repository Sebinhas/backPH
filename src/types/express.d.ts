import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      id: number;
      email: string;
      rol: 'admin' | 'usuario';
    };
  }
}
