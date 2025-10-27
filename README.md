# 🚀 Backend API - Sistema de Gestión Agrícola

API REST construida con NestJS, TypeScript, PostgreSQL y JWT para autenticación.

## 📋 Características

- ✅ Autenticación con JWT
- ✅ Validación de datos con class-validator
- ✅ Documentación API con Swagger
- ✅ TypeORM con PostgreSQL
- ✅ Arquitectura modular escalable
- ✅ Seguridad con bcrypt y guards
- ✅ CORS configurado
- ✅ Variables de entorno

## 🛠️ Stack Tecnológico

- **Framework**: NestJS 10.x
- **Lenguaje**: TypeScript 5.x
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
- **Autenticación**: JWT + Passport
- **Documentación**: Swagger/OpenAPI
- **Validación**: class-validator, class-transformer

## 📦 Instalación

### Prerequisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd backPH
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=agricultural_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

4. **Configurar base de datos**

Asegúrate de que PostgreSQL esté corriendo y crea la base de datos:

```sql
CREATE DATABASE agricultural_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

5. **Ejecutar migraciones** (cuando estén disponibles)

```bash
npm run migration:run
```

## 🚀 Ejecución

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

### Debug
```bash
npm run start:debug
```

## 📚 Documentación API

Una vez que la aplicación esté corriendo, accede a la documentación Swagger en:

```
http://localhost:3000/api/docs
```

## 🔐 Endpoints de Autenticación

### POST /api/v1/auth/register
Registrar un nuevo usuario

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

**Response (201):**
```json
{
  "status": 201,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-10-02T12:00:00.000Z",
    "updatedAt": "2025-10-02T12:00:00.000Z"
  }
}
```

### POST /api/v1/auth/login
Iniciar sesión

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "status": 200,
  "message": "Autenticación exitosa",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "user",
      "isActive": true,
      "createdAt": "2025-10-02T12:00:00.000Z",
      "updatedAt": "2025-10-02T12:00:00.000Z"
    },
    "access_token": "jwt-token-here"
  }
}
```

## 🏗️ Estructura del Proyecto

```
src/
├── common/                      # Recursos compartidos
│   ├── decorators/              # Decoradores personalizados
│   ├── guards/                  # Guards de autenticación
│   └── strategies/              # Estrategias de Passport
├── config/                      # Configuración
│   ├── data-source.ts          # Configuración TypeORM
│   └── database.module.ts      # Módulo de base de datos
├── modules/                     # Módulos de funcionalidad
│   └── auth/                   # Módulo de autenticación
│       ├── dto/                # DTOs con validación
│       ├── entities/           # Entidades TypeORM
│       ├── types/              # Types/Interfaces
│       ├── auth.controller.ts  # Controlador
│       ├── auth.service.ts     # Servicio
│       └── auth.module.ts      # Módulo
├── app.module.ts               # Módulo raíz
└── main.ts                     # Punto de entrada
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Ejecutar en modo desarrollo con hot reload

# Compilación
npm run build              # Compilar TypeScript a JavaScript

# Producción
npm run start:prod         # Ejecutar en modo producción

# Testing
npm run test               # Ejecutar tests unitarios
npm run test:watch         # Ejecutar tests en modo watch
npm run test:cov           # Ejecutar tests con cobertura

# Migraciones
npm run migration:create   # Crear nueva migración
npm run migration:run      # Ejecutar migraciones pendientes
npm run migration:revert   # Revertir última migración
npm run migration:show     # Mostrar estado de migraciones

# Linting y formato
npm run lint               # Ejecutar ESLint
npm run format             # Formatear código con Prettier
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt (12 salt rounds)
- Tokens JWT con expiración configurable
- Validación de entrada con class-validator
- Guards para proteger rutas
- CORS configurado

## 🤝 Convenciones de Código

- **Código**: En inglés (variables, funciones, clases)
- **Mensajes**: En español (errores, respuestas, validaciones)
- **Comentarios**: En español
- **Respuestas API**: Patrón `{ status, message, data }`
- **Fechas**: Siempre como string ISO en respuestas

## 📊 Patrón de Respuestas

Todas las respuestas de la API siguen este patrón:

```typescript
{
  status: number;      // Código HTTP
  message: string;     // Mensaje en español
  data?: any;          // Datos opcionales
}
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📄 Licencia

ISC

## 👨‍💻 Autor

Sistema de Gestión Agrícola
