import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import cultivosRoutes from './routes/cultivos.routes';
import lotesRoutes from './routes/lotes.routes';
import planificacionRoutes from './routes/planificacion.routes';
import trabajadoresRoutes from './routes/trabajadores.routes';
import tiposLaborRoutes from './routes/tiposLabor.routes';
import laboresRoutes from './routes/labores.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportesRoutes from './routes/reportes.routes';
import rolesRoutes from './routes/roles.routes';
import usuariosRoutes from './routes/usuarios.routes';
import { errorHandler } from './middlewares/errorHandler';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (reportes generados)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cultivos', cultivosRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/planificacion', planificacionRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/tipos-labor', tiposLaborRoutes);
app.use('/api/labores', laboresRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Manejador de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

