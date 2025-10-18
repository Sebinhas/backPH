# 🚀 Backend - Sistema Agrícola

Backend desarrollado con **Node.js**, **Express**, **TypeScript** y **MySQL** para la gestión de autenticación y usuarios.

## 📋 Características

- ✅ Autenticación con JWT
- ✅ Registro de usuarios
- ✅ Login y logout
- ✅ Recuperación de contraseña por email
- ✅ Validación de datos con express-validator
- ✅ Seguridad con bcrypt
- ✅ Base de datos MySQL
- ✅ TypeScript
- ✅ Arquitectura modular (MVC)

## 🛠️ Tecnologías

- **Node.js** v18+
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **MySQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Nodemailer** - Envío de emails

## 📦 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
Copia el archivo de ejemplo y configura tus variables:
```bash
cp env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_agricola

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRES_IN=7d

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password
```

3. **Configurar base de datos:**
```bash
npm run build
npm run db:setup
```

Este comando creará la base de datos y las tablas necesarias.

## 🚀 Uso

### Modo desarrollo (con hot reload):
```bash
npm run dev
```

### Compilar TypeScript:
```bash
npm run build
```

### Modo producción:
```bash
npm start
```

## 📚 API Endpoints

### Autenticación

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Respuesta (200):**
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

#### 2. Registro
```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

#### 3. Recuperar Contraseña
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

#### 4. Resetear Contraseña
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "token_recibido_por_email",
  "password": "nueva_password123"
}
```

#### 5. Verificar Token
```http
GET /api/auth/verify
Authorization: Bearer {token}
```

#### 6. Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### Health Check
```http
GET /health
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Configuración de MySQL
│   │   └── setupDatabase.ts     # Script de inicialización
│   ├── controllers/
│   │   └── auth.controller.ts   # Controladores de autenticación
│   ├── middlewares/
│   │   ├── authMiddleware.ts    # Middleware de autenticación
│   │   ├── errorHandler.ts      # Manejo de errores
│   │   └── validation.ts        # Validaciones
│   ├── models/
│   │   └── user.model.ts        # Modelo de usuario
│   ├── routes/
│   │   └── auth.routes.ts       # Rutas de autenticación
│   ├── services/
│   │   └── auth.service.ts      # Lógica de negocio
│   ├── types/
│   │   ├── express.d.ts         # Tipos de Express
│   │   └── index.ts             # Tipos generales
│   ├── utils/
│   │   ├── email.util.ts        # Utilidades de email
│   │   └── jwt.util.ts          # Utilidades de JWT
│   └── server.ts                # Punto de entrada
├── .env                         # Variables de entorno
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Tokens JWT con expiración
- Blacklist de tokens para logout
- Validación de datos en todas las peticiones
- Protección contra SQL injection con prepared statements
- CORS configurado

## 🗄️ Base de Datos

### Tabla: usuarios
```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'usuario') DEFAULT 'usuario',
  avatar VARCHAR(500),
  reset_token VARCHAR(255),
  reset_token_expiry DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla: token_blacklist
```sql
CREATE TABLE token_blacklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

## 🧪 Pruebas con cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Registro
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test User","email":"test@test.com","password":"123456"}'
```

### Verificar Token
```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer TU_TOKEN"
```

## 📧 Configuración de Email

Para usar Gmail:
1. Activa la verificación en 2 pasos
2. Genera una "Contraseña de aplicación"
3. Usa esa contraseña en `EMAIL_PASSWORD`

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Datos inválidos |
| 401 | Credenciales incorrectas o token inválido |
| 403 | Acceso denegado |
| 404 | Usuario no encontrado |
| 409 | Email ya existe |
| 500 | Error del servidor |

## 🔄 Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| PORT | Puerto del servidor | No (default: 5000) |
| DB_HOST | Host de MySQL | Sí |
| DB_USER | Usuario de MySQL | Sí |
| DB_PASSWORD | Contraseña de MySQL | Sí |
| DB_NAME | Nombre de la BD | Sí |
| JWT_SECRET | Clave secreta para JWT | Sí |
| JWT_EXPIRES_IN | Tiempo de expiración | No (default: 7d) |
| EMAIL_USER | Email para envíos | No |
| EMAIL_PASSWORD | Password del email | No |

## 📝 Notas

- El rol por defecto es `usuario`
- Los tokens expiran en 7 días por defecto
- Los tokens de reset expiran en 1 hora
- El email es opcional (forgot-password no funcionará sin él)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

ISC License

