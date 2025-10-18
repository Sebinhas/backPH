import { ApiError } from '../middlewares/errorHandler';
import pool from '../config/database';
import {
  EstadisticaAgricola,
  ProduccionMensual,
  RendimientoPorHectarea,
  DistribucionCultivo,
  EficienciaCampo,
  LaborDiaria,
  CalidadProduccion,
  ActividadesPlanificadas,
  TrabajadoresPorCargo,
  TiposLaborFrecuentes,
  EstadoLotes,
  RendimientoPorTrabajador,
  CostosPorActividad,
  DashboardFilters,
  DashboardParams,
  ProduccionPorMes,
  RendimientoPorMes,
  EficienciaPorLote,
  LaboresPorDia,
  CalidadPorMes
} from '../models/dashboard.model';

export class DashboardService {
  // Método helper para construir condiciones WHERE dinámicas
  private static buildWhereConditions(filters?: DashboardFilters): string {
    if (!filters) return '';
    
    const conditions: string[] = [];
    
    if (filters.fechaInicio) {
      conditions.push(`lab.fecha >= '${filters.fechaInicio.toISOString().split('T')[0]}'`);
    }
    
    if (filters.fechaFin) {
      conditions.push(`lab.fecha <= '${filters.fechaFin.toISOString().split('T')[0]}'`);
    }
    
    if (filters.cultivoId) {
      conditions.push(`l.cultivo_id = ${filters.cultivoId}`);
    }
    
    if (filters.loteId) {
      conditions.push(`l.id = ${filters.loteId}`);
    }
    
    if (filters.trabajadorId) {
      conditions.push(`lab.trabajador_id = ${filters.trabajadorId}`);
    }
    
    return conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';
  }
  static async getEstadisticas(filters?: DashboardFilters): Promise<EstadisticaAgricola> {
    try {
      // Construir condiciones WHERE dinámicas
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta optimizada que obtiene todos los datos en una sola query
      const [result] = await pool.query(`
        SELECT 
          -- Área y campos
          COALESCE(SUM(DISTINCT l.area_hectareas), 0) as totalArea,
          COUNT(DISTINCT l.id) as camposActivos,
          COUNT(DISTINCT l.cultivo_id) as cultivosEnProceso,
          
          -- Producción del mes actual
          COALESCE(SUM(CASE 
            WHEN lab.estado = 'completada' 
            AND MONTH(lab.fecha) = MONTH(CURRENT_DATE())
            AND YEAR(lab.fecha) = YEAR(CURRENT_DATE())
            THEN lab.peso_total 
            ELSE 0 
          END), 0) as totalProduccion,
          
          -- Eficiencia promedio
          COALESCE(AVG(CASE 
            WHEN lab.estado = 'completada' 
            AND MONTH(lab.fecha) = MONTH(CURRENT_DATE())
            AND YEAR(lab.fecha) = YEAR(CURRENT_DATE())
            THEN lab.rendimiento_por_hora 
            ELSE NULL 
          END), 0) as eficienciaPromedio,
          
          -- Variaciones mensuales
          COALESCE(SUM(CASE 
            WHEN lab.estado = 'completada' 
            AND MONTH(lab.fecha) = MONTH(CURRENT_DATE())
            AND YEAR(lab.fecha) = YEAR(CURRENT_DATE())
            THEN lab.peso_total 
            ELSE 0 
          END), 0) as mesActual,
          
          COALESCE(SUM(CASE 
            WHEN lab.estado = 'completada' 
            AND MONTH(lab.fecha) = MONTH(CURRENT_DATE()) - 1
            AND YEAR(lab.fecha) = YEAR(CURRENT_DATE())
            THEN lab.peso_total 
            ELSE 0 
          END), 0) as mesAnterior
          
        FROM lotes l
        LEFT JOIN labores lab ON l.nombre = lab.lote
        WHERE l.estado != 'INACTIVO'
        ${whereConditions}
      `);

      const data = (result as any)[0];
      const totalArea = data?.totalArea || 0;
      const camposActivos = data?.camposActivos || 0;
      const cultivosEnProceso = data?.cultivosEnProceso || 0;
      const totalProduccion = data?.totalProduccion || 0;
      const eficienciaPromedio = data?.eficienciaPromedio || 0;
      const mesActual = data?.mesActual || 0;
      const mesAnterior = data?.mesAnterior || 0;

      // Calcular métricas derivadas
      const rendimientoPromedio = totalArea > 0 ? totalProduccion / totalArea : 0;
      const variacionMensual = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : 0;
      const variacionSemanal = variacionMensual / 4; // Aproximación semanal
      const proyeccionRendimiento = totalProduccion * (1 + variacionMensual / 100);

      return {
        totalProduccion: Math.round(totalProduccion),
        totalArea: Math.round(totalArea * 100) / 100,
        rendimientoPromedio: Math.round(rendimientoPromedio * 100) / 100,
        variacionSemanal: Math.round(variacionSemanal * 100) / 100,
        variacionMensual: Math.round(variacionMensual * 100) / 100,
        proyeccionRendimiento: Math.round(proyeccionRendimiento),
        camposActivos,
        cultivosEnProceso,
        eficienciaPromedio: Math.round(eficienciaPromedio * 100) / 100
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw new ApiError(500, 'Error al obtener estadísticas del dashboard');
    }
  }

  static async getProduccionMensual(filters?: DashboardFilters): Promise<ProduccionMensual[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta optimizada con PIVOT para obtener todos los cultivos en una sola query
      const [result] = await pool.query(`
        SELECT 
          DATE_FORMAT(lab.fecha, '%Y-%m') as mes_key,
          SUM(CASE WHEN lab.cultivo = 'Café' THEN lab.peso_total ELSE 0 END) as cafe,
          SUM(CASE WHEN lab.cultivo = 'Caña de Azúcar' THEN lab.peso_total ELSE 0 END) as cana,
          SUM(CASE WHEN lab.cultivo = 'Maíz' THEN lab.peso_total ELSE 0 END) as maiz,
          SUM(CASE WHEN lab.cultivo = 'Plátano' THEN lab.peso_total ELSE 0 END) as platano,
          SUM(lab.peso_total) as total
        FROM labores lab
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.estado = 'completada'
        AND lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        ${whereConditions}
        GROUP BY DATE_FORMAT(lab.fecha, '%Y-%m')
        ORDER BY DATE_FORMAT(lab.fecha, '%Y-%m') DESC
      `);

      const data = result as ProduccionPorMes[];
      
      // Generar los últimos 6 meses con datos reales o ceros
      const meses = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
      
      return meses.map(mes => {
        const datosMes = data.find(row => {
          // Convertir mes_key (YYYY-MM) a nombre de mes
          const mesKey = row.mes_key;
          const fecha = new Date(mesKey + '-01');
          const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'short' });
          return nombreMes === mes;
        });
        
        return {
          mes,
          cafe: Math.round(datosMes?.cafe || 0),
          cana: Math.round(datosMes?.cana || 0),
          maiz: Math.round(datosMes?.maiz || 0),
          platano: Math.round(datosMes?.platano || 0),
          total: Math.round(datosMes?.total || 0)
        };
      });
    } catch (error) {
      console.error('Error obteniendo producción mensual:', error);
      throw new ApiError(500, 'Error al obtener producción mensual del dashboard');
    }
  }

  static async getRendimientoHectarea(filters?: DashboardFilters): Promise<RendimientoPorHectarea[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta optimizada para rendimiento por hectárea
      const [result] = await pool.query(`
        SELECT 
          DATE_FORMAT(lab.fecha, '%Y-%m') as mes_key,
          COALESCE(SUM(lab.peso_total), 0) as produccion_total,
          COALESCE(SUM(l.area_hectareas), 0) as area_total,
          CASE 
            WHEN SUM(l.area_hectareas) > 0 
            THEN SUM(lab.peso_total) / SUM(l.area_hectareas) 
            ELSE 0 
          END as rendimiento_real
        FROM labores lab
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.estado = 'completada'
        AND lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        AND l.area_hectareas > 0
        ${whereConditions}
        GROUP BY DATE_FORMAT(lab.fecha, '%Y-%m')
        ORDER BY DATE_FORMAT(lab.fecha, '%Y-%m')
      `);

      const data = result as RendimientoPorMes[];
      const meses = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
      const objetivo = 150; // Meta fija de 150 kg/ha
      
      return meses.map(mes => {
        const datosMes = data.find(row => {
          // Convertir mes_key (YYYY-MM) a nombre de mes
          const mesKey = row.mes_key;
          const fecha = new Date(mesKey + '-01');
          const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'short' });
          return nombreMes === mes;
        });
        const rendimiento = datosMes?.rendimiento_real || 0;
        
        return {
          mes,
          rendimiento: Math.round(rendimiento * 100) / 100,
          objetivo
        };
      });
    } catch (error) {
      console.error('Error obteniendo rendimiento por hectárea:', error);
      throw new ApiError(500, 'Error al obtener rendimiento por hectárea del dashboard');
    }
  }

  static async getDistribucionCultivos(filters?: DashboardFilters): Promise<DistribucionCultivo[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta optimizada para distribución de cultivos
      const [result] = await pool.query(`
        SELECT 
          lab.cultivo as nombre,
          COUNT(DISTINCT lab.lote) as lotes_count,
          SUM(lab.peso_total) as produccion_total,
          AVG(l.area_hectareas) as area_promedio,
          SUM(l.area_hectareas) as area_total
        FROM labores lab
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.estado = 'completada'
        AND lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        ${whereConditions}
        GROUP BY lab.cultivo
        HAVING produccion_total > 0
        ORDER BY produccion_total DESC
      `);

      const cultivos = result as any[];
      const totalProduccion = cultivos.reduce((sum, cultivo) => sum + cultivo.produccion_total, 0);
      const totalArea = cultivos.reduce((sum, cultivo) => sum + cultivo.area_total, 0);
      
      const colores = ['#8B4513', '#90EE90', '#FFD700', '#FFE135', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
      
      return cultivos.map((cultivo, index) => ({
        nombre: cultivo.nombre,
        area: Math.round(cultivo.area_total * 100) / 100,
        porcentaje: Math.round((cultivo.area_total / totalArea) * 100 * 100) / 100,
        produccion: Math.round(cultivo.produccion_total),
        color: colores[index % colores.length]
      }));
    } catch (error) {
      console.error('Error obteniendo distribución de cultivos:', error);
      throw new ApiError(500, 'Error al obtener distribución de cultivos del dashboard');
    }
  }

  static async getEficienciaCampos(filters?: DashboardFilters): Promise<EficienciaCampo[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta optimizada para eficiencia de campos
      const [result] = await pool.query(`
        SELECT 
          lab.lote as campo,
          AVG(lab.rendimiento_por_hora) as eficiencia,
          COUNT(lab.id) as total_labores,
          SUM(CASE WHEN lab.estado = 'completada' THEN 1 ELSE 0 END) as labores_completadas,
          (SUM(CASE WHEN lab.estado = 'completada' THEN 1 ELSE 0 END) / COUNT(lab.id)) * 100 as porcentaje_completado
        FROM labores lab
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)
        ${whereConditions}
        GROUP BY lab.lote
        HAVING total_labores > 0
        ORDER BY eficiencia DESC
        LIMIT 10
      `);

      const lotes = result as EficienciaPorLote[];
      
      return lotes.map(lote => ({
        campo: lote.campo,
        eficiencia: Math.round((lote.eficiencia || 0) * 10), // Convertir a porcentaje
        meta: 85 // Meta fija de 85%
      }));
    } catch (error) {
      console.error('Error obteniendo eficiencia de campos:', error);
      throw new ApiError(500, 'Error al obtener eficiencia de campos del dashboard');
    }
  }

  static async getLaboresDiarias(filters?: DashboardFilters): Promise<LaborDiaria[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta optimizada para labores diarias con PIVOT
      const [result] = await pool.query(`
        SELECT 
          DATE_FORMAT(lab.fecha, '%Y-%m-%d') as dia_key,
          SUM(CASE WHEN tl.categoria = 'cosecha' THEN 1 ELSE 0 END) as cosecha,
          SUM(CASE WHEN tl.categoria = 'riego' THEN 1 ELSE 0 END) as riego,
          SUM(CASE WHEN tl.categoria = 'fertilizacion' THEN 1 ELSE 0 END) as fertilizacion,
          SUM(CASE WHEN tl.categoria = 'otro' THEN 1 ELSE 0 END) as transporte
        FROM labores lab
        LEFT JOIN tipos_labor tl ON lab.tipo_labor_id = tl.id
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        AND lab.estado = 'completada'
        ${whereConditions}
        GROUP BY DATE_FORMAT(lab.fecha, '%Y-%m-%d')
        ORDER BY DATE_FORMAT(lab.fecha, '%Y-%m-%d')
      `);

      const labores = result as LaboresPorDia[];
      const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      
      return dias.map(dia => {
        const laboresDia = labores.find(lab => {
          // Convertir dia_key (YYYY-MM-DD) a nombre de día
          const diaKey = lab.dia_key;
          const fecha = new Date(diaKey);
          const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
          return nombreDia === dia;
        });
        
        return {
          dia,
          cosecha: laboresDia?.cosecha || 0,
          riego: laboresDia?.riego || 0,
          fertilizacion: laboresDia?.fertilizacion || 0,
          transporte: laboresDia?.transporte || 0
        };
      });
    } catch (error) {
      console.error('Error obteniendo labores diarias:', error);
      throw new ApiError(500, 'Error al obtener labores diarias del dashboard');
    }
  }

  static async getCalidadProduccion(filters?: DashboardFilters): Promise<CalidadProduccion[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta optimizada para calidad de producción
      const [result] = await pool.query(`
        SELECT 
          DATE_FORMAT(lab.fecha, '%Y-%m') as mes_key,
          AVG(lab.rendimiento_por_hora) as rendimiento_promedio,
          COUNT(lab.id) as total_labores,
          STDDEV(lab.rendimiento_por_hora) as desviacion_estandar
        FROM labores lab
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.estado = 'completada'
        AND lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        ${whereConditions}
        GROUP BY DATE_FORMAT(lab.fecha, '%Y-%m')
        ORDER BY DATE_FORMAT(lab.fecha, '%Y-%m')
      `);

      const labores = result as CalidadPorMes[];
      const meses = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
      
      return meses.map(mes => {
        const datosMes = labores.find(lab => {
          // Convertir mes_key (YYYY-MM) a nombre de mes
          const mesKey = lab.mes_key;
          const fecha = new Date(mesKey + '-01');
          const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'short' });
          return nombreMes === mes;
        });
        const rendimiento = datosMes?.rendimiento_promedio || 0;
        const desviacion = datosMes?.desviacion_estandar || 0;
        
        // Calcular distribución de calidad basada en rendimiento y consistencia
        let excelente, buena, regular, mala;
        
        // Factor de consistencia (menor desviación = mejor calidad)
        const factorConsistencia = Math.max(0, 1 - (desviacion / Math.max(rendimiento, 1)));
        
        if (rendimiento >= 30) {
          excelente = Math.round((60 + factorConsistencia * 20) * 100) / 100;
          buena = Math.round((25 + (1 - factorConsistencia) * 10) * 100) / 100;
          regular = Math.round((10 + (1 - factorConsistencia) * 5) * 100) / 100;
          mala = Math.round((5 - factorConsistencia * 5) * 100) / 100;
        } else if (rendimiento >= 20) {
          excelente = Math.round((50 + factorConsistencia * 15) * 100) / 100;
          buena = Math.round((30 + (1 - factorConsistencia) * 15) * 100) / 100;
          regular = Math.round((15 + (1 - factorConsistencia) * 10) * 100) / 100;
          mala = Math.round((5 + (1 - factorConsistencia) * 5) * 100) / 100;
        } else if (rendimiento >= 10) {
          excelente = Math.round((40 + factorConsistencia * 10) * 100) / 100;
          buena = Math.round((35 + (1 - factorConsistencia) * 15) * 100) / 100;
          regular = Math.round((20 + (1 - factorConsistencia) * 10) * 100) / 100;
          mala = Math.round((5 + (1 - factorConsistencia) * 10) * 100) / 100;
        } else {
          excelente = Math.round((30 + factorConsistencia * 5) * 100) / 100;
          buena = Math.round((40 + (1 - factorConsistencia) * 10) * 100) / 100;
          regular = Math.round((25 + (1 - factorConsistencia) * 10) * 100) / 100;
          mala = Math.round((5 + (1 - factorConsistencia) * 15) * 100) / 100;
        }
        
        // Normalizar para que sume 100
        const total = excelente + buena + regular + mala;
        excelente = Math.round((excelente / total) * 100);
        buena = Math.round((buena / total) * 100);
        regular = Math.round((regular / total) * 100);
        mala = Math.round((mala / total) * 100);
        
        return {
          mes,
          excelente,
          buena,
          regular,
          mala
        };
      });
    } catch (error) {
      console.error('Error obteniendo calidad de producción:', error);
      throw new ApiError(500, 'Error al obtener calidad de producción del dashboard');
    }
  }

  static async getActividadesPlanificadas(filters?: DashboardFilters): Promise<ActividadesPlanificadas[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta para actividades planificadas por estado
      const [result] = await pool.query(`
        SELECT 
          DATE_FORMAT(ap.fecha_inicio_planificada, '%Y-%m') as mes_key,
          SUM(CASE WHEN ap.estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
          SUM(CASE WHEN ap.estado = 'EN_PROGRESO' THEN 1 ELSE 0 END) as en_progreso,
          SUM(CASE WHEN ap.estado = 'COMPLETADA' THEN 1 ELSE 0 END) as completadas,
          SUM(CASE WHEN ap.estado = 'ATRASADA' THEN 1 ELSE 0 END) as atrasadas,
          SUM(CASE WHEN ap.estado = 'CANCELADA' THEN 1 ELSE 0 END) as canceladas
        FROM actividades_planificadas ap
        LEFT JOIN lotes l ON ap.lote_id = l.id
        WHERE ap.fecha_inicio_planificada >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        ${whereConditions}
        GROUP BY DATE_FORMAT(ap.fecha_inicio_planificada, '%Y-%m')
        ORDER BY DATE_FORMAT(ap.fecha_inicio_planificada, '%Y-%m')
      `);

      const actividades = result as any[];
      const meses = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
      
      return meses.map(mes => {
        const datosMes = actividades.find(act => {
          const mesKey = act.mes_key;
          const fecha = new Date(mesKey + '-01');
          const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'short' });
          return nombreMes === mes;
        });
        
        return {
          mes,
          pendientes: datosMes?.pendientes || 0,
          en_progreso: datosMes?.en_progreso || 0,
          completadas: datosMes?.completadas || 0,
          atrasadas: datosMes?.atrasadas || 0,
          canceladas: datosMes?.canceladas || 0
        };
      });
    } catch (error) {
      console.error('Error obteniendo actividades planificadas:', error);
      throw new ApiError(500, 'Error al obtener actividades planificadas del dashboard');
    }
  }

  static async getTrabajadoresPorCargo(filters?: DashboardFilters): Promise<TrabajadoresPorCargo[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta para trabajadores por cargo
      const [result] = await pool.query(`
        SELECT 
          t.cargo,
          COUNT(t.id) as cantidad,
          SUM(CASE WHEN t.estado = 'activo' THEN 1 ELSE 0 END) as activos,
          SUM(CASE WHEN t.estado != 'activo' THEN 1 ELSE 0 END) as inactivos
        FROM trabajadores t
        ${whereConditions ? 'WHERE ' + whereConditions.replace('lab.', 't.') : ''}
        GROUP BY t.cargo
        ORDER BY cantidad DESC
      `);

      const trabajadores = result as any[];
      const colores = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
      
      return trabajadores.map((trabajador, index) => ({
        cargo: trabajador.cargo,
        cantidad: trabajador.cantidad,
        activos: trabajador.activos,
        inactivos: trabajador.inactivos,
        color: colores[index % colores.length]
      }));
    } catch (error) {
      console.error('Error obteniendo trabajadores por cargo:', error);
      throw new ApiError(500, 'Error al obtener trabajadores por cargo del dashboard');
    }
  }

  static async getTiposLaborFrecuentes(filters?: DashboardFilters): Promise<TiposLaborFrecuentes[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta para tipos de labor más frecuentes
      const [result] = await pool.query(`
        SELECT 
          tl.nombre as tipo,
          tl.categoria,
          COUNT(lab.id) as cantidad
        FROM labores lab
        LEFT JOIN tipos_labor tl ON lab.tipo_labor_id = tl.id
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.estado = 'completada'
        AND lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        ${whereConditions}
        GROUP BY tl.id, tl.nombre, tl.categoria
        ORDER BY cantidad DESC
        LIMIT 8
      `);

      const tipos = result as any[];
      const total = tipos.reduce((sum, tipo) => sum + tipo.cantidad, 0);
      const colores = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
      
      return tipos.map((tipo, index) => ({
        tipo: tipo.tipo,
        cantidad: tipo.cantidad,
        categoria: tipo.categoria,
        porcentaje: Math.round((tipo.cantidad / total) * 100 * 100) / 100,
        color: colores[index % colores.length]
      }));
    } catch (error) {
      console.error('Error obteniendo tipos de labor frecuentes:', error);
      throw new ApiError(500, 'Error al obtener tipos de labor frecuentes del dashboard');
    }
  }

  static async getEstadoLotes(filters?: DashboardFilters): Promise<EstadoLotes[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta para estado de lotes
      const [result] = await pool.query(`
        SELECT 
          l.estado,
          COUNT(l.id) as cantidad,
          SUM(l.area_hectareas) as area_total
        FROM lotes l
        ${whereConditions ? 'WHERE ' + whereConditions.replace('lab.', 'l.') : ''}
        GROUP BY l.estado
        ORDER BY cantidad DESC
      `);

      const lotes = result as any[];
      const totalArea = lotes.reduce((sum, lote) => sum + lote.area_total, 0);
      const colores = {
        'EN_CRECIMIENTO': '#10B981',
        'EN_COSECHA': '#F59E0B',
        'EN_MANTENIMIENTO': '#3B82F6',
        'INACTIVO': '#6B7280'
      };
      
      return lotes.map(lote => ({
        estado: lote.estado,
        cantidad: lote.cantidad,
        area_total: Math.round(lote.area_total * 100) / 100,
        porcentaje: Math.round((lote.area_total / totalArea) * 100 * 100) / 100,
        color: colores[lote.estado as keyof typeof colores] || '#6B7280'
      }));
    } catch (error) {
      console.error('Error obteniendo estado de lotes:', error);
      throw new ApiError(500, 'Error al obtener estado de lotes del dashboard');
    }
  }

  static async getRendimientoPorTrabajador(filters?: DashboardFilters): Promise<RendimientoPorTrabajador[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta para rendimiento por trabajador
      const [result] = await pool.query(`
        SELECT 
          CONCAT(t.nombres, ' ', t.apellidos) as trabajador,
          AVG(lab.rendimiento_por_hora) as rendimiento_promedio,
          COUNT(lab.id) as total_labores,
          (SUM(CASE WHEN lab.estado = 'completada' THEN 1 ELSE 0 END) / COUNT(lab.id)) * 100 as eficiencia
        FROM labores lab
        LEFT JOIN trabajadores t ON lab.trabajador_id = t.id
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)
        ${whereConditions}
        GROUP BY t.id, t.nombres, t.apellidos
        HAVING total_labores > 0
        ORDER BY rendimiento_promedio DESC
        LIMIT 10
      `);

      const trabajadores = result as any[];
      
      return trabajadores.map(trabajador => ({
        trabajador: trabajador.trabajador,
        rendimiento_promedio: Math.round(trabajador.rendimiento_promedio * 100) / 100,
        total_labores: trabajador.total_labores,
        eficiencia: Math.round(trabajador.eficiencia * 100) / 100
      }));
    } catch (error) {
      console.error('Error obteniendo rendimiento por trabajador:', error);
      throw new ApiError(500, 'Error al obtener rendimiento por trabajador del dashboard');
    }
  }

  static async getCostosPorActividad(filters?: DashboardFilters): Promise<CostosPorActividad[]> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      
      // Consulta para costos por actividad
      const [result] = await pool.query(`
        SELECT 
          DATE_FORMAT(lab.fecha, '%Y-%m') as mes_key,
          SUM(CASE WHEN tl.categoria = 'siembra' THEN lab.costo_estimado ELSE 0 END) as siembra,
          SUM(CASE WHEN tl.categoria = 'riego' THEN lab.costo_estimado ELSE 0 END) as riego,
          SUM(CASE WHEN tl.categoria = 'fertilizacion' THEN lab.costo_estimado ELSE 0 END) as fertilizacion,
          SUM(CASE WHEN tl.categoria = 'cosecha' THEN lab.costo_estimado ELSE 0 END) as cosecha,
          SUM(CASE WHEN tl.categoria = 'mantenimiento' THEN lab.costo_estimado ELSE 0 END) as mantenimiento,
          SUM(lab.costo_estimado) as total
        FROM labores lab
        LEFT JOIN tipos_labor tl ON lab.tipo_labor_id = tl.id
        LEFT JOIN lotes l ON lab.lote = l.nombre
        WHERE lab.estado = 'completada'
        AND lab.fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        ${whereConditions}
        GROUP BY DATE_FORMAT(lab.fecha, '%Y-%m')
        ORDER BY DATE_FORMAT(lab.fecha, '%Y-%m')
      `);

      const costos = result as any[];
      const meses = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
      
      return meses.map(mes => {
        const datosMes = costos.find(costo => {
          const mesKey = costo.mes_key;
          const fecha = new Date(mesKey + '-01');
          const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'short' });
          return nombreMes === mes;
        });
        
        return {
          mes,
          siembra: Math.round(datosMes?.siembra || 0),
          riego: Math.round(datosMes?.riego || 0),
          fertilizacion: Math.round(datosMes?.fertilizacion || 0),
          cosecha: Math.round(datosMes?.cosecha || 0),
          mantenimiento: Math.round(datosMes?.mantenimiento || 0),
          total: Math.round(datosMes?.total || 0)
        };
      });
    } catch (error) {
      console.error('Error obteniendo costos por actividad:', error);
      throw new ApiError(500, 'Error al obtener costos por actividad del dashboard');
    }
  }

  // Método para obtener todos los datos del dashboard de una vez
  static async getDashboardCompleto(filters?: DashboardFilters): Promise<{
    estadisticas: EstadisticaAgricola;
    produccionMensual: ProduccionMensual[];
    rendimientoHectarea: RendimientoPorHectarea[];
    distribucionCultivos: DistribucionCultivo[];
    eficienciaCampos: EficienciaCampo[];
    laboresDiarias: LaborDiaria[];
    calidadProduccion: CalidadProduccion[];
    actividadesPlanificadas: ActividadesPlanificadas[];
    trabajadoresPorCargo: TrabajadoresPorCargo[];
    tiposLaborFrecuentes: TiposLaborFrecuentes[];
    estadoLotes: EstadoLotes[];
    rendimientoPorTrabajador: RendimientoPorTrabajador[];
    costosPorActividad: CostosPorActividad[];
  }> {
    try {
      // Ejecutar todas las consultas en paralelo para mejor rendimiento
      const [
        estadisticas,
        produccionMensual,
        rendimientoHectarea,
        distribucionCultivos,
        eficienciaCampos,
        laboresDiarias,
        calidadProduccion,
        actividadesPlanificadas,
        trabajadoresPorCargo,
        tiposLaborFrecuentes,
        estadoLotes,
        rendimientoPorTrabajador,
        costosPorActividad
      ] = await Promise.all([
        this.getEstadisticas(filters),
        this.getProduccionMensual(filters),
        this.getRendimientoHectarea(filters),
        this.getDistribucionCultivos(filters),
        this.getEficienciaCampos(filters),
        this.getLaboresDiarias(filters),
        this.getCalidadProduccion(filters),
        this.getActividadesPlanificadas(filters),
        this.getTrabajadoresPorCargo(filters),
        this.getTiposLaborFrecuentes(filters),
        this.getEstadoLotes(filters),
        this.getRendimientoPorTrabajador(filters),
        this.getCostosPorActividad(filters)
      ]);

      return {
        estadisticas,
        produccionMensual,
        rendimientoHectarea,
        distribucionCultivos,
        eficienciaCampos,
        laboresDiarias,
        calidadProduccion,
        actividadesPlanificadas,
        trabajadoresPorCargo,
        tiposLaborFrecuentes,
        estadoLotes,
        rendimientoPorTrabajador,
        costosPorActividad
      };
    } catch (error) {
      console.error('Error obteniendo dashboard completo:', error);
      throw new ApiError(500, 'Error al obtener datos completos del dashboard');
    }
  }
}

