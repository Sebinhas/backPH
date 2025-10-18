import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { DashboardFilters } from '../models/dashboard.model';

export class DashboardController {
  // Método para extraer filtros de la query string
  private static extractFilters(req: Request): DashboardFilters {
    const { fechaInicio, fechaFin, cultivoId, loteId, trabajadorId } = req.query;
    
    return {
      fechaInicio: fechaInicio ? new Date(fechaInicio as string) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin as string) : undefined,
      cultivoId: cultivoId ? parseInt(cultivoId as string) : undefined,
      loteId: loteId ? parseInt(loteId as string) : undefined,
      trabajadorId: trabajadorId ? parseInt(trabajadorId as string) : undefined
    };
  }

  // Endpoint para obtener todos los datos del dashboard
  static async getDashboardCompleto(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getDashboardCompleto(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getEstadisticas(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProduccionMensual(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getProduccionMensual(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRendimientoHectarea(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getRendimientoHectarea(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDistribucionCultivos(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getDistribucionCultivos(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEficienciaCampos(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getEficienciaCampos(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLaboresDiarias(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getLaboresDiarias(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCalidadProduccion(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getCalidadProduccion(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  // Nuevos endpoints para las gráficas adicionales
  static async getActividadesPlanificadas(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getActividadesPlanificadas(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTrabajadoresPorCargo(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getTrabajadoresPorCargo(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTiposLaborFrecuentes(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getTiposLaborFrecuentes(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEstadoLotes(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getEstadoLotes(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRendimientoPorTrabajador(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getRendimientoPorTrabajador(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCostosPorActividad(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = DashboardController.extractFilters(req);
      const data = await DashboardService.getCostosPorActividad(filters);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

