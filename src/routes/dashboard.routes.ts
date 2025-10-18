import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/dashboard - Obtener todos los datos del dashboard
router.get('/', DashboardController.getDashboardCompleto);

// GET /api/dashboard/estadisticas
router.get('/estadisticas', DashboardController.getEstadisticas);

// GET /api/dashboard/produccion-mensual
router.get('/produccion-mensual', DashboardController.getProduccionMensual);

// GET /api/dashboard/rendimiento-hectarea
router.get('/rendimiento-hectarea', DashboardController.getRendimientoHectarea);

// GET /api/dashboard/distribucion-cultivos
router.get('/distribucion-cultivos', DashboardController.getDistribucionCultivos);

// GET /api/dashboard/eficiencia-campos
router.get('/eficiencia-campos', DashboardController.getEficienciaCampos);

// GET /api/dashboard/labores-diarias
router.get('/labores-diarias', DashboardController.getLaboresDiarias);

// GET /api/dashboard/calidad-produccion
router.get('/calidad-produccion', DashboardController.getCalidadProduccion);

// Nuevas rutas para gráficas adicionales
// GET /api/dashboard/actividades-planificadas
router.get('/actividades-planificadas', DashboardController.getActividadesPlanificadas);

// GET /api/dashboard/trabajadores-por-cargo
router.get('/trabajadores-por-cargo', DashboardController.getTrabajadoresPorCargo);

// GET /api/dashboard/tipos-labor-frecuentes
router.get('/tipos-labor-frecuentes', DashboardController.getTiposLaborFrecuentes);

// GET /api/dashboard/estado-lotes
router.get('/estado-lotes', DashboardController.getEstadoLotes);

// GET /api/dashboard/rendimiento-por-trabajador
router.get('/rendimiento-por-trabajador', DashboardController.getRendimientoPorTrabajador);

// GET /api/dashboard/costos-por-actividad
router.get('/costos-por-actividad', DashboardController.getCostosPorActividad);

export default router;

