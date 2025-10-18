# 🔌 API - Módulo de Autenticación

Documentación completa de los endpoints de autenticación.

## Base URL

```
http://localhost:5000/api
```

## Endpoints Requeridos

### 1. Login

**POST** `/api/auth/login`

Autentica un usuario y retorna un token JWT.

**Request:**
```typescript
{
  email: string
  password: string
}
```

**Ejemplo:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Response (200):**
```typescript
{
  user: {
    id: number
    nombre: string
    email: string
    rol: 'admin' | 'usuario'
    avatar?: string
  },
  token: string
}
```

**Ejemplo de respuesta:**
```json
{
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "usuario@ejemplo.com",
    "rol": "usuario",
    "avatar": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `400` - Email o contraseña no proporcionados
- `401` - Credenciales incorrectas

---

### 2. Registro

**POST** `/api/auth/register`

Registra un nuevo usuario en el sistema.

**Request:**
```typescript
{
  nombre: string
  email: string
  password: string
}
```

**Ejemplo:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "password123"
}
```

**Response (201):**
```typescript
{
  user: {
    id: number
    nombre: string
    email: string
    rol: 'usuario'
    avatar?: string
  },
  token: string
}
```

**Validaciones:**
- Nombre: requerido, 2-255 caracteres
- Email: formato válido, único
- Password: mínimo 6 caracteres

**Errores:**
- `400` - Datos inválidos
- `409` - Email ya existe

---

### 3. Recuperar Contraseña

**POST** `/api/auth/forgot-password`

Envía un email con un token para restablecer la contraseña.

**Request:**
```typescript
{
  email: string
}
```

**Ejemplo:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response (200):**
```typescript
{
  message: string
}
```

**Ejemplo de respuesta:**
```json
{
  "message": "Si el email existe, recibirás instrucciones para restablecer tu contraseña"
}
```

**Nota:** Por seguridad, siempre retorna el mismo mensaje, exista o no el email.

**Errores:**
- `400` - Email inválido
- `500` - Error al enviar email

---

### 4. Resetear Contraseña

**POST** `/api/auth/reset-password`

Restablece la contraseña usando el token recibido por email.

**Request:**
```typescript
{
  token: string
  password: string
}
```

**Ejemplo:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "nueva_password123"
}
```

**Response (200):**
```typescript
{
  message: string
}
```

**Ejemplo de respuesta:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

**Validaciones:**
- Token: requerido, válido, no expirado
- Password: mínimo 6 caracteres

**Errores:**
- `400` - Token inválido o expirado
- `400` - Password muy corta

---

### 5. Verificar Token

**GET** `/api/auth/verify`

Verifica la validez del token JWT y retorna los datos del usuario.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```typescript
{
  id: number
  nombre: string
  email: string
  rol: 'admin' | 'usuario'
  avatar?: string
}
```

**Ejemplo de respuesta:**
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "email": "usuario@ejemplo.com",
  "rol": "usuario",
  "avatar": null
}
```

**Errores:**
- `401` - Token no proporcionado
- `401` - Token inválido o expirado
- `404` - Usuario no encontrado

---

### 6. Logout

**POST** `/api/auth/logout`

Cierra la sesión del usuario agregando el token a una lista negra.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```typescript
{
  message: string
}
```

**Ejemplo de respuesta:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

**Errores:**
- `401` - Token no proporcionado
- `401` - Token inválido

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Petición exitosa |
| 201 | Recurso creado exitosamente |
| 400 | Datos inválidos o petición mal formada |
| 401 | No autenticado (credenciales incorrectas o token inválido) |
| 403 | No autorizado (sin permisos suficientes) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: email ya existe) |
| 500 | Error interno del servidor |

---

## Validaciones Requeridas

### Login
✅ Email formato válido  
✅ Contraseña requerida

### Registro
✅ Email único  
✅ Email formato válido  
✅ Contraseña mínimo 6 caracteres  
✅ Nombre requerido (2-255 caracteres)

### Forgot Password
✅ Email debe tener formato válido  
✅ Email debe existir en BD (no se revela al cliente)

### Reset Password
✅ Token válido y no expirado  
✅ Contraseña mínimo 6 caracteres

---

## Autenticación

La API usa **JWT (JSON Web Tokens)** para la autenticación.

### Flujo de autenticación:

1. Usuario hace login/registro
2. API retorna un token JWT
3. Cliente guarda el token (localStorage, sessionStorage, etc.)
4. Cliente incluye el token en cada petición protegida:
   ```
   Authorization: Bearer {token}
   ```

### Estructura del token:

```typescript
{
  id: number,
  email: string,
  rol: 'admin' | 'usuario',
  iat: number,  // issued at
  exp: number   // expiration
}
```

### Expiración:
- Tokens de acceso: 7 días (configurable)
- Tokens de reset: 1 hora

---

## Ejemplos con cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "password123"
  }'
```

### Registro
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "usuario@ejemplo.com",
    "password": "password123"
  }'
```

### Verificar Token
```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Ejemplos con JavaScript (Fetch)

### Login
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('token', data.token);
    return data;
  } else {
    throw new Error(data.message);
  }
};
```

### Petición con token
```javascript
const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/auth/verify', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

---

## Seguridad

### Implementada:
✅ Passwords hasheados con bcrypt  
✅ JWT con expiración  
✅ Token blacklist para logout  
✅ Validación de datos  
✅ Protección SQL injection  
✅ CORS configurado  
✅ Rate limiting (recomendado implementar)

### Recomendaciones:
- Usar HTTPS en producción
- Implementar rate limiting
- Usar refresh tokens para mayor seguridad
- Implementar 2FA (autenticación de dos factores)
- Logs de intentos de login fallidos

---

## Testing

### Postman Collection

Puedes importar esta colección a Postman:

```json
{
  "info": {
    "name": "Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@test.com\",\n  \"password\": \"123456\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    }
  ]
}
```

---

## Soporte

Para más información, consulta el [README.md](./README.md) del proyecto.

