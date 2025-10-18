import { Request, Response, NextFunction } from 'express';
import { ReportesService } from '../services/reportes.service';
import { ReporteRequest } from '../models/reportes.model';

export class ReportesController {
  // Obtener reportes disponibles
  static async getReportesDisponibles(req: Request, res: Response, next: NextFunction) {
    try {
      const reportes = await ReportesService.getReportesDisponibles();
      res.json({
        success: true,
        data: reportes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Generar reporte PDF
  static async generarPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipoReporte, fechaInicio, fechaFin, cultivoId, loteId, trabajadorId } = req.body;

      if (!tipoReporte) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de reporte es requerido'
        });
      }

      const request: ReporteRequest = {
        tipoReporte,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        cultivoId: cultivoId ? parseInt(cultivoId) : undefined,
        loteId: loteId ? parseInt(loteId) : undefined,
        trabajadorId: trabajadorId ? parseInt(trabajadorId) : undefined
      };

      const resultado = await ReportesService.generarPDF(request);

      res.json({
        success: true,
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Generar reporte Excel
  static async generarExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipoReporte, fechaInicio, fechaFin, cultivoId, loteId, trabajadorId } = req.body;

      if (!tipoReporte) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de reporte es requerido'
        });
      }

      if (tipoReporte === 'Comparativo') {
        return res.status(400).json({
          success: false,
          message: 'El reporte comparativo solo está disponible en formato PDF'
        });
      }

      const request: Omit<ReporteRequest, 'tipoReporte'> & { tipoReporte: Exclude<ReporteRequest['tipoReporte'], 'Comparativo'> } = {
        tipoReporte,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        cultivoId: cultivoId ? parseInt(cultivoId) : undefined,
        loteId: loteId ? parseInt(loteId) : undefined,
        trabajadorId: trabajadorId ? parseInt(trabajadorId) : undefined
      };

      const resultado = await ReportesService.generarExcel(request);

      res.json({
        success: true,
        data: resultado,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Descargar archivo de reporte
  static async descargarReporte(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename } = req.params;
      const path = require('path');
      const fs = require('fs');

      const filePath = path.join(__dirname, '../../uploads/reportes', filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Determinar tipo de contenido
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.xlsx') {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      res.setHeader('Content-Type', contentType);

      // Enviar archivo
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }

  // Obtener información de un reporte específico
  static async getInfoReporte(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipoReporte } = req.params;
      
      const reportes = await ReportesService.getReportesDisponibles();
      const reporte = reportes.find(r => r.id === tipoReporte);

      if (!reporte) {
        return res.status(404).json({
          success: false,
          message: 'Tipo de reporte no encontrado'
        });
      }

      res.json({
        success: true,
        data: reporte,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Listar archivos de reportes generados
  static async listarReportesGenerados(req: Request, res: Response, next: NextFunction) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const uploadsDir = path.join(__dirname, '../../uploads/reportes');
      
      if (!fs.existsSync(uploadsDir)) {
        return res.json({
          success: true,
          data: [],
          message: 'No hay reportes generados'
        });
      }

      const archivos = fs.readdirSync(uploadsDir);
      const reportes = archivos.map(archivo => {
        const stats = fs.statSync(path.join(uploadsDir, archivo));
        return {
          filename: archivo,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/api/reportes/descargar/${archivo}`
        };
      }).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      res.json({
        success: true,
        data: reportes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar reporte generado
  static async eliminarReporte(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename } = req.params;
      const path = require('path');
      const fs = require('fs');

      const filePath = path.join(__dirname, '../../uploads/reportes', filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      // Eliminar archivo
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'Reporte eliminado correctamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}