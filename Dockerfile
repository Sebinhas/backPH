# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para build)
RUN npm ci && npm cache clean --force

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS production

WORKDIR /app

# Crear usuario no root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar dependencias de producción desde dependencies stage
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar código compilado desde build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# Copiar archivos necesarios
COPY --chown=nestjs:nodejs package*.json ./

# Cambiar a usuario no root
USER nestjs

# Variables de entorno por defecto
ENV NODE_ENV=production

# Health check - usa la variable PORT
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/v1/auth', (r) => {process.exit(r.statusCode === 401 ? 0 : 1)})"

# Comando para ejecutar la aplicación
CMD ["node", "dist/main.js"]

