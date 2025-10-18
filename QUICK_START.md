# 🚀 Inicio Rápido

Guía rápida para poner en marcha el backend.

## ⚡ Pasos Rápidos

### 1. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto backend:

```bash
# Copia el archivo de ejemplo
cp env.example .env
```

Edita `.env` con tus configuraciones:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL
DB_NAME=sistema_agricola

JWT_SECRET=cambiar_por_clave_segura_en_produccion

FRONTEND_URL=http://localhost:5173
```

### 2. Configurar base de datos

Asegúrate de tener MySQL instalado y corriendo, luego:

```bash
# Compilar el proyecto
npm run build

# Crear base de datos y tablas
npm run db:setup
```

### 3. Iniciar el servidor

```bash
# Modo desarrollo (con hot reload)
npm run dev
```

El servidor estará corriendo en: **http://localhost:5000**

---

## ✅ Verificar instalación

Abre tu navegador o usa curl:

```bash
curl http://localhost:5000/health
```

Deberías ver:
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente"
}
```

---

## 🧪 Probar la API

### 1. Crear usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario Test",
    "email": "test@test.com",
    "password": "123456"
  }'
```

### 2. Hacer login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123456"
  }'
```

Guarda el `token` que recibes.

### 3. Verificar token
```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 📝 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor en modo desarrollo |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Inicia servidor en modo producción |
| `npm run db:setup` | Configura la base de datos |

---

## ❌ Solución de problemas

### Error: "Cannot connect to MySQL"
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que el puerto 3306 esté disponible

### Error: "Database not found"
- Ejecuta `npm run db:setup` para crear la BD

### Error: "Port 5000 already in use"
- Cambia el puerto en `.env` (ej: `PORT=5001`)
- O cierra la aplicación que está usando el puerto 5000

### Dependencias no instaladas
```bash
npm install
```

---

## 🎯 Siguiente paso

Conecta tu frontend al backend editando el archivo de axios:

```typescript
// frontend/src/lib/axios.ts
const BASE_URL = 'http://localhost:5000/api';
```

¡Listo! Ya puedes usar el sistema de autenticación completo.

---

## 📚 Más información

- [README.md](./README.md) - Documentación completa
- [API_DOCS.md](./API_DOCS.md) - Documentación de la API

