import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email único del usuario',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Contraseña del usuario (mínimo 8 caracteres)',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del usuario',
    required: false,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del usuario',
    required: false,
  })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsOptional()
  lastName?: string;
}
