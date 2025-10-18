export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password: string;
  rol: string;
  avatar?: string;
  reset_token?: string;
  reset_token_expiry?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    avatar?: string;
  };
  token: string;
}

export interface VerifyResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  avatar?: string;
}

