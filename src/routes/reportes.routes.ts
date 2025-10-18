import { Router } from 'express';
import { ReportesController } from '../controllers/reportes.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/reportes - Obtener reportes disponibles
router.get('/', ReportesController.getReportesDisponibles);

// GET /api/reportes/generados - Listar reportes generados
router.get('/generados', ReportesController.listarReportesGenerados);

// GET /api/reportes/:tipoReporte - Obtener información de un reporte específico
router.get('/:tipoReporte', ReportesController.getInfoReporte);

// POST /api/reportes/generar-pdf - Generar reporte PDF
router.post('/generar-pdf', ReportesController.generarPDF);

// POST /api/reportes/generar-excel - Generar reporte Excel
router.post('/generar-excel', ReportesController.generarExcel);

// GET /api/reportes/descargar/:filename - Descargar archivo de reporte
router.get('/descargar/:filename', ReportesController.descargarReporte);

// DELETE /api/reportes/:filename - Eliminar reporte generado
router.delete('/:filename', ReportesController.eliminarReporte);

export default router;