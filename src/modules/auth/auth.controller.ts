import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { AuthResponse, UserCreatedResponse } from './types';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema con validaciones completas',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      user: {
        summary: 'Registro de usuario',
        value: {
          email: 'user@example.com',
          password: 'SecurePass123!',
          firstName: 'Juan',
          lastName: 'Pérez',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        status: 201,
        message: 'Usuario creado exitosamente',
        data: {
          id: 'uuid-here',
          email: 'user@example.com',
          firstName: 'Juan',
          lastName: 'Pérez',
          role: 'user',
          isActive: true,
          createdAt: '2025-10-02T12:00:00.000Z',
          updatedAt: '2025-10-02T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Email ya registrado',
  })
  async register(@Body() registerDto: RegisterDto): Promise<UserCreatedResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y devuelve un token JWT',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      user: {
        summary: 'Inicio de sesión',
        value: {
          email: 'user@example.com',
          password: 'SecurePass123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    schema: {
      example: {
        status: 200,
        message: 'Autenticación exitosa',
        data: {
          user: {
            id: 'uuid-here',
            email: 'user@example.com',
            firstName: 'Juan',
            lastName: 'Pérez',
            role: 'user',
            isActive: true,
            createdAt: '2025-10-02T12:00:00.000Z',
            updatedAt: '2025-10-02T12:00:00.000Z',
          },
          access_token: 'jwt-token-here',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }
}

