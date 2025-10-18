import { ApiError } from '../middlewares/errorHandler';
import pool from '../config/database';
import { DashboardService } from './dashboard.service';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { 
  ReporteRequest, 
  ReporteResponse, 
  ReporteDisponible, 
  DatosProductividad,
  DatosRendimiento,
  DatosCostos,
  DatosCalidad,
  DatosComparativo,
  FiltrosReporte
} from '../models/reportes.model';
import path from 'path';
import fs from 'fs';

export class ReportesService {
  // Obtener reportes disponibles
  static async getReportesDisponibles(): Promise<ReporteDisponible[]> {
    return [
      {
        id: 'productividad',
        nombre: 'Reporte de Productividad',
        descripcion: 'Análisis detallado de producción por cultivo, distribución de áreas y estadísticas generales',
        formatos: ['PDF', 'Excel'],
        icono: 'TrendingUp',
        color: '#10B981'
      },
      {
        id: 'rendimiento',
        nombre: 'Reporte de Rendimiento',
        descripcion: 'Evaluación del rendimiento por hectárea, eficiencia de campos y cumplimiento de objetivos',
        formatos: ['PDF', 'Excel'],
        icono: 'BarChart3',
        color: '#3B82F6'
      },
      {
        id: 'costos',
        nombre: 'Reporte de Costos Operacionales',
        descripcion: 'Desglose completo de costos por categoría: personal, insumos, transporte y otros',
        formatos: ['PDF', 'Excel'],
        icono: 'DollarSign',
        color: '#F59E0B'
      },
    ];
  }

  // Obtener datos para reporte de productividad
  private static async getDatosProductividad(filtros?: FiltrosReporte): Promise<DatosProductividad> {
    try {
      const [estadisticas, produccionMensual, distribucionCultivos] = await Promise.all([
        DashboardService.getEstadisticas(filtros),
        DashboardService.getProduccionMensual(filtros),
        DashboardService.getDistribucionCultivos(filtros)
      ]);

      return {
        estadisticas,
        produccionMensual,
        distribucionCultivos
      };
    } catch (error) {
      console.error('Error obteniendo datos de productividad:', error);
      throw new ApiError(500, 'Error al obtener datos de productividad para el reporte');
    }
  }

  // Obtener datos para reporte de rendimiento
  private static async getDatosRendimiento(filtros?: FiltrosReporte): Promise<DatosRendimiento> {
    try {
      const [rendimientoHectarea, eficienciaCampos, rendimientoPorTrabajador] = await Promise.all([
        DashboardService.getRendimientoHectarea(filtros),
        DashboardService.getEficienciaCampos(filtros),
        DashboardService.getRendimientoPorTrabajador(filtros)
      ]);

      return {
        rendimientoHectarea,
        eficienciaCampos,
        rendimientoPorTrabajador
      };
    } catch (error) {
      console.error('Error obteniendo datos de rendimiento:', error);
      throw new ApiError(500, 'Error al obtener datos de rendimiento para el reporte');
    }
  }

  // Obtener datos para reporte de costos
  private static async getDatosCostos(filtros?: FiltrosReporte): Promise<DatosCostos> {
    try {
      const costosPorActividad = await DashboardService.getCostosPorActividad(filtros);
      
      // Calcular resumen de costos
      const totalPersonal = costosPorActividad.reduce((sum, item) => sum + item.siembra + item.cosecha, 0);
      const totalInsumos = costosPorActividad.reduce((sum, item) => sum + item.fertilizacion, 0);
      const totalTransporte = costosPorActividad.reduce((sum, item) => sum + item.riego, 0);
      const totalMantenimiento = costosPorActividad.reduce((sum, item) => sum + item.mantenimiento, 0);
      const totalGeneral = totalPersonal + totalInsumos + totalTransporte + totalMantenimiento;
      
      const variacionMensual = costosPorActividad.length > 1 
        ? ((costosPorActividad[costosPorActividad.length - 1].total - costosPorActividad[costosPorActividad.length - 2].total) / costosPorActividad[costosPorActividad.length - 2].total) * 100
        : 0;

      return {
        costosPorActividad,
        resumenCostos: {
          totalPersonal,
          totalInsumos,
          totalTransporte,
          totalMantenimiento,
          totalGeneral,
          variacionMensual
        }
      };
    } catch (error) {
      console.error('Error obteniendo datos de costos:', error);
      throw new ApiError(500, 'Error al obtener datos de costos para el reporte');
    }
  }

  // Obtener datos para reporte de calidad
  private static async getDatosCalidad(filtros?: FiltrosReporte): Promise<DatosCalidad> {
    try {
      const calidadProduccion = await DashboardService.getCalidadProduccion(filtros);
      
      // Calcular resumen de calidad
      const promedioExcelente = calidadProduccion.reduce((sum, item) => sum + item.excelente, 0) / calidadProduccion.length;
      const promedioBuena = calidadProduccion.reduce((sum, item) => sum + item.buena, 0) / calidadProduccion.length;
      const promedioRegular = calidadProduccion.reduce((sum, item) => sum + item.regular, 0) / calidadProduccion.length;
      const promedioMala = calidadProduccion.reduce((sum, item) => sum + item.mala, 0) / calidadProduccion.length;
      
      // Determinar tendencia
      const ultimoMes = calidadProduccion[calidadProduccion.length - 1];
      const penultimoMes = calidadProduccion[calidadProduccion.length - 2];
      let tendencia: 'mejorando' | 'estable' | 'empeorando' = 'estable';
      
      if (penultimoMes) {
        const mejora = ultimoMes.excelente - penultimoMes.excelente;
        if (mejora > 5) tendencia = 'mejorando';
        else if (mejora < -5) tendencia = 'empeorando';
      }

      return {
        calidadProduccion,
        resumenCalidad: {
          promedioExcelente,
          promedioBuena,
          promedioRegular,
          promedioMala,
          tendencia
        }
      };
    } catch (error) {
      console.error('Error obteniendo datos de calidad:', error);
      throw new ApiError(500, 'Error al obtener datos de calidad para el reporte');
    }
  }

  // Obtener datos para reporte comparativo
  private static async getDatosComparativo(filtros?: FiltrosReporte): Promise<DatosComparativo> {
    try {
      const [
        estadisticas,
        distribucionCultivos,
        eficienciaCampos,
        rendimientoPorTrabajador,
        costosPorActividad
      ] = await Promise.all([
        DashboardService.getEstadisticas(filtros),
        DashboardService.getDistribucionCultivos(filtros),
        DashboardService.getEficienciaCampos(filtros),
        DashboardService.getRendimientoPorTrabajador(filtros),
        DashboardService.getCostosPorActividad(filtros)
      ]);

      // Encontrar mejor cultivo
      const mejorCultivo = distribucionCultivos.reduce((prev, current) => 
        prev.produccion > current.produccion ? prev : current
      );

      // Encontrar mejor campo
      const mejorCampo = eficienciaCampos.reduce((prev, current) => 
        prev.eficiencia > current.eficiencia ? prev : current
      );

      // Encontrar mejor trabajador
      const mejorTrabajador = rendimientoPorTrabajador.reduce((prev, current) => 
        prev.rendimiento_promedio > current.rendimiento_promedio ? prev : current
      );

      // Encontrar mejor mes
      const mejorMes = costosPorActividad.reduce((prev, current) => 
        prev.total > current.total ? prev : current
      );

      return {
        resumenEjecutivo: {
          totalProduccion: estadisticas.totalProduccion,
          variacionMensual: estadisticas.variacionMensual,
          eficienciaPromedio: estadisticas.eficienciaPromedio,
          camposActivos: estadisticas.camposActivos,
          cultivoDestacado: mejorCultivo.nombre,
          rendimientoDestacado: mejorCultivo.produccion
        },
        mejoresDesempenos: {
          mejorCultivo: mejorCultivo.nombre,
          mejorCampo: mejorCampo.campo,
          mejorTrabajador: mejorTrabajador.trabajador,
          mejorMes: mejorMes.mes
        },
        recomendaciones: [
          'Incrementar frecuencia de riego en campos con bajo rendimiento',
          'Optimizar costos de transporte mediante consolidación de rutas',
          'Mantener el nivel de eficiencia actual del cultivo destacado',
          'Implementar monitoreo continuo de calidad',
          'Activar campos inactivos para aumentar producción total'
        ],
        proyecciones: {
          produccionProyectada: estadisticas.proyeccionRendimiento,
          costosProyectados: costosPorActividad[costosPorActividad.length - 1]?.total || 0,
          eficienciaProyectada: estadisticas.eficienciaPromedio * 1.05
        }
      };
    } catch (error) {
      console.error('Error obteniendo datos comparativos:', error);
      throw new ApiError(500, 'Error al obtener datos comparativos para el reporte');
    }
  }

  // Generar reporte PDF
  static async generarPDF(request: ReporteRequest): Promise<ReporteResponse> {
    try {
      const filtros: FiltrosReporte = {
        fechaInicio: request.fechaInicio,
        fechaFin: request.fechaFin,
        cultivoId: request.cultivoId,
        loteId: request.loteId,
        trabajadorId: request.trabajadorId
      };

      let datos: any;
      let titulo: string;

      switch (request.tipoReporte) {
        case 'Productividad':
          datos = await this.getDatosProductividad(filtros);
          titulo = 'Reporte de Productividad';
          break;
        case 'Rendimiento':
          datos = await this.getDatosRendimiento(filtros);
          titulo = 'Reporte de Rendimiento';
          break;
        case 'Costos':
          datos = await this.getDatosCostos(filtros);
          titulo = 'Reporte de Costos Operacionales';
          break;
        default:
          throw new ApiError(400, 'Tipo de reporte no válido');
      }

      const pdfBuffer = await this.crearPDF(titulo, datos, request.tipoReporte);
      const filename = `Reporte_${request.tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Crear directorio si no existe
      const uploadsDir = path.join(__dirname, '../../uploads/reportes');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, pdfBuffer);

      return {
        success: true,
        url: `/uploads/reportes/${filename}`,
        filename,
        size: pdfBuffer.length,
        generatedAt: new Date().toISOString(),
        tipoReporte: request.tipoReporte
      };
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new ApiError(500, 'Error al generar el reporte PDF');
    }
  }

  // Generar reporte Excel
  static async generarExcel(request: Omit<ReporteRequest, 'tipoReporte'> & { tipoReporte: Exclude<ReporteRequest['tipoReporte'], 'Comparativo'> }): Promise<ReporteResponse> {
    try {
      const filtros: FiltrosReporte = {
        fechaInicio: request.fechaInicio,
        fechaFin: request.fechaFin,
        cultivoId: request.cultivoId,
        loteId: request.loteId,
        trabajadorId: request.trabajadorId
      };

      let datos: any;
      let titulo: string;

      switch (request.tipoReporte) {
        case 'Productividad':
          datos = await this.getDatosProductividad(filtros);
          titulo = 'Reporte de Productividad';
          break;
        case 'Rendimiento':
          datos = await this.getDatosRendimiento(filtros);
          titulo = 'Reporte de Rendimiento';
          break;
        case 'Costos':
          datos = await this.getDatosCostos(filtros);
          titulo = 'Reporte de Costos Operacionales';
          break;
        default:
          throw new ApiError(400, 'Tipo de reporte no válido');
      }

      const excelBuffer = await this.crearExcel(titulo, datos, request.tipoReporte);
      const filename = `Reporte_${request.tipoReporte}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Crear directorio si no existe
      const uploadsDir = path.join(__dirname, '../../uploads/reportes');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, excelBuffer);

      return {
        success: true,
        url: `/uploads/reportes/${filename}`,
        filename,
        size: excelBuffer.length,
        generatedAt: new Date().toISOString(),
        tipoReporte: request.tipoReporte,
        sheets: this.getSheetNames(request.tipoReporte)
      };
    } catch (error) {
      console.error('Error generando Excel:', error);
      throw new ApiError(500, 'Error al generar el reporte Excel');
    }
  }

  // Crear PDF usando jsPDF
  private static async crearPDF(titulo: string, datos: any, tipoReporte: string): Promise<Buffer> {
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Configuración de colores
    const colorPrimario = [34, 139, 34]; // Verde agrícola
    const colorSecundario = [100, 100, 100];

    // Título principal
    doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Sistema de Gestión Agrícola', 105, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(titulo, 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generado: ${fechaActual}`, 105, 33, { align: 'center' });

    // Resetear color de texto
    doc.setTextColor(0, 0, 0);

    let yPos = 50;

    // Generar contenido según el tipo de reporte
    switch (tipoReporte) {
      case 'Productividad':
        yPos = this.generarContenidoProductividadPDF(doc, datos, yPos, colorPrimario, colorSecundario);
        break;
      case 'Rendimiento':
        yPos = this.generarContenidoRendimientoPDF(doc, datos, yPos, colorPrimario, colorSecundario);
        break;
      case 'Costos':
        yPos = this.generarContenidoCostosPDF(doc, datos, yPos, colorPrimario, colorSecundario);
        break;
      case 'Calidad':
        yPos = this.generarContenidoCalidadPDF(doc, datos, yPos, colorPrimario, colorSecundario);
        break;
      case 'Comparativo':
        yPos = this.generarContenidoComparativoPDF(doc, datos, yPos, colorPrimario, colorSecundario);
        break;
    }

    // Pie de página
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Sistema de Gestión Agrícola - Confidencial', 105, 290, { align: 'center' });
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  // Crear Excel usando ExcelJS
  private static async crearExcel(titulo: string, datos: any, tipoReporte: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Configurar propiedades del workbook
    workbook.creator = 'Sistema de Gestión Agrícola';
    workbook.lastModifiedBy = 'Sistema Agrícola';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Generar contenido según el tipo de reporte
    switch (tipoReporte) {
      case 'Productividad':
        this.generarContenidoProductividadExcel(workbook, datos);
        break;
      case 'Rendimiento':
        this.generarContenidoRendimientoExcel(workbook, datos);
        break;
      case 'Costos':
        this.generarContenidoCostosExcel(workbook, datos);
        break;
      case 'Calidad':
        this.generarContenidoCalidadExcel(workbook, datos);
        break;
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // Métodos auxiliares para generar contenido PDF (implementación simplificada)
  private static generarContenidoProductividadPDF(doc: jsPDF, datos: DatosProductividad, yPos: number, colorPrimario: number[], colorSecundario: number[]): number {
    // Estadísticas generales
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Estadísticas Generales', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text(`Total Producción: ${datos.estadisticas.totalProduccion.toLocaleString()} kg`, 20, yPos);
    yPos += 7;
    doc.text(`Área Total: ${datos.estadisticas.totalArea.toLocaleString()} hectáreas`, 20, yPos);
    yPos += 7;
    doc.text(`Rendimiento Promedio: ${datos.estadisticas.rendimientoPromedio.toFixed(1)} kg/ha`, 20, yPos);
    yPos += 7;
    doc.text(`Campos Activos: ${datos.estadisticas.camposActivos}`, 20, yPos);
    yPos += 7;
    doc.text(`Eficiencia Promedio: ${datos.estadisticas.eficienciaPromedio}%`, 20, yPos);
    yPos += 15;

    // Distribución de cultivos
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Distribución de Cultivos', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    datos.distribucionCultivos.forEach(cultivo => {
      doc.text(`${cultivo.nombre}: ${cultivo.area} ha - Producción: ${cultivo.produccion.toLocaleString()} kg`, 20, yPos);
      yPos += 6;
    });

    return yPos + 20;
  }

  private static generarContenidoRendimientoPDF(doc: jsPDF, datos: DatosRendimiento, yPos: number, colorPrimario: number[], colorSecundario: number[]): number {
    // Rendimiento por hectárea
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Rendimiento por Hectárea', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    datos.rendimientoHectarea.slice(-4).forEach(item => {
      const cumplimiento = ((item.rendimiento / item.objetivo) * 100).toFixed(1);
      doc.text(`${item.mes}: ${item.rendimiento} kg/ha (Objetivo: ${item.objetivo} kg/ha) - ${cumplimiento}%`, 20, yPos);
      yPos += 6;
    });
    yPos += 10;

    // Eficiencia por campo
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Eficiencia por Campo', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    datos.eficienciaCampos.forEach(campo => {
      const estado = campo.eficiencia >= campo.meta ? '✓ Cumple meta' : '✗ Requiere mejora';
      doc.text(`${campo.campo}: ${campo.eficiencia}% (Meta: ${campo.meta}%) - ${estado}`, 20, yPos);
      yPos += 6;
    });

    return yPos + 20;
  }

  private static generarContenidoCostosPDF(doc: jsPDF, datos: DatosCostos, yPos: number, colorPrimario: number[], colorSecundario: number[]): number {
    // Resumen de costos
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Resumen de Costos', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text(`Total Personal: $${datos.resumenCostos.totalPersonal.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Insumos: $${datos.resumenCostos.totalInsumos.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Transporte: $${datos.resumenCostos.totalTransporte.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Mantenimiento: $${datos.resumenCostos.totalMantenimiento.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Total General: $${datos.resumenCostos.totalGeneral.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Variación Mensual: ${datos.resumenCostos.variacionMensual.toFixed(1)}%`, 20, yPos);
    yPos += 15;

    // Detalle por mes
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Detalle por Mes', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    datos.costosPorActividad.slice(-3).forEach(item => {
      doc.text(`${item.mes}: Total $${item.total.toLocaleString()}`, 20, yPos);
      yPos += 5;
      doc.text(`  Siembra: $${item.siembra.toLocaleString()} | Riego: $${item.riego.toLocaleString()}`, 25, yPos);
      yPos += 5;
      doc.text(`  Fertilización: $${item.fertilizacion.toLocaleString()} | Cosecha: $${item.cosecha.toLocaleString()}`, 25, yPos);
      yPos += 5;
      doc.text(`  Mantenimiento: $${item.mantenimiento.toLocaleString()}`, 25, yPos);
      yPos += 8;
    });

    return yPos + 20;
  }

  private static generarContenidoCalidadPDF(doc: jsPDF, datos: DatosCalidad, yPos: number, colorPrimario: number[], colorSecundario: number[]): number {
    // Resumen de calidad
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Resumen de Calidad', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text(`Promedio Excelente: ${datos.resumenCalidad.promedioExcelente.toFixed(1)}%`, 20, yPos);
    yPos += 7;
    doc.text(`Promedio Buena: ${datos.resumenCalidad.promedioBuena.toFixed(1)}%`, 20, yPos);
    yPos += 7;
    doc.text(`Promedio Regular: ${datos.resumenCalidad.promedioRegular.toFixed(1)}%`, 20, yPos);
    yPos += 7;
    doc.text(`Promedio Mala: ${datos.resumenCalidad.promedioMala.toFixed(1)}%`, 20, yPos);
    yPos += 7;
    doc.text(`Tendencia: ${datos.resumenCalidad.tendencia}`, 20, yPos);
    yPos += 15;

    // Detalle por mes
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Evolución por Mes', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    datos.calidadProduccion.slice(-4).forEach(item => {
      doc.text(`${item.mes}: Excelente ${item.excelente}% | Buena ${item.buena}% | Regular ${item.regular}% | Mala ${item.mala}%`, 20, yPos);
      yPos += 6;
    });

    return yPos + 20;
  }

  private static generarContenidoComparativoPDF(doc: jsPDF, datos: DatosComparativo, yPos: number, colorPrimario: number[], colorSecundario: number[]): number {
    // Resumen ejecutivo
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Resumen Ejecutivo', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text(`• Producción total: ${datos.resumenEjecutivo.totalProduccion.toLocaleString()} kg`, 25, yPos);
    yPos += 6;
    doc.text(`• Variación mensual: +${datos.resumenEjecutivo.variacionMensual}%`, 25, yPos);
    yPos += 6;
    doc.text(`• Eficiencia promedio: ${datos.resumenEjecutivo.eficienciaPromedio}%`, 25, yPos);
    yPos += 6;
    doc.text(`• Campos activos: ${datos.resumenEjecutivo.camposActivos}`, 25, yPos);
    yPos += 6;
    doc.text(`• Cultivo destacado: ${datos.resumenEjecutivo.cultivoDestacado}`, 25, yPos);
    yPos += 15;

    // Mejores desempeños
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Mejores Desempeños', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text(`• Mejor cultivo: ${datos.mejoresDesempenos.mejorCultivo}`, 25, yPos);
    yPos += 6;
    doc.text(`• Mejor campo: ${datos.mejoresDesempenos.mejorCampo}`, 25, yPos);
    yPos += 6;
    doc.text(`• Mejor trabajador: ${datos.mejoresDesempenos.mejorTrabajador}`, 25, yPos);
    yPos += 6;
    doc.text(`• Mejor mes: ${datos.mejoresDesempenos.mejorMes}`, 25, yPos);
    yPos += 15;

    // Recomendaciones
    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Recomendaciones Estratégicas', 20, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    datos.recomendaciones.forEach((recomendacion, index) => {
      doc.text(`${index + 1}. ${recomendacion}`, 25, yPos, { maxWidth: 160 });
      yPos += 7;
    });

    return yPos + 20;
  }

  // Métodos auxiliares para generar contenido Excel
  private static generarContenidoProductividadExcel(workbook: ExcelJS.Workbook, datos: DatosProductividad): void {
    // Hoja 1: Estadísticas
    const wsEstadisticas = workbook.addWorksheet('Estadísticas');
    wsEstadisticas.addRow(['Métrica', 'Valor']);
    wsEstadisticas.addRow(['Total Producción (kg)', datos.estadisticas.totalProduccion]);
    wsEstadisticas.addRow(['Área Total (ha)', datos.estadisticas.totalArea]);
    wsEstadisticas.addRow(['Rendimiento Promedio (kg/ha)', datos.estadisticas.rendimientoPromedio]);
    wsEstadisticas.addRow(['Campos Activos', datos.estadisticas.camposActivos]);
    wsEstadisticas.addRow(['Eficiencia Promedio (%)', datos.estadisticas.eficienciaPromedio]);

    // Hoja 2: Producción Mensual
    const wsProduccion = workbook.addWorksheet('Producción Mensual');
    wsProduccion.addRow(['Mes', 'Café', 'Caña', 'Maíz', 'Plátano', 'Total']);
    datos.produccionMensual.forEach(item => {
      wsProduccion.addRow([item.mes, item.cafe, item.cana, item.maiz, item.platano, item.total]);
    });

    // Hoja 3: Distribución de Cultivos
    const wsDistribucion = workbook.addWorksheet('Distribución Cultivos');
    wsDistribucion.addRow(['Cultivo', 'Área (ha)', 'Porcentaje (%)', 'Producción (kg)']);
    datos.distribucionCultivos.forEach(cultivo => {
      wsDistribucion.addRow([cultivo.nombre, cultivo.area, cultivo.porcentaje, cultivo.produccion]);
    });
  }

  private static generarContenidoRendimientoExcel(workbook: ExcelJS.Workbook, datos: DatosRendimiento): void {
    // Hoja 1: Rendimiento por Hectárea
    const wsRendimiento = workbook.addWorksheet('Rendimiento');
    wsRendimiento.addRow(['Mes', 'Rendimiento (kg/ha)', 'Objetivo (kg/ha)', 'Cumplimiento (%)']);
    datos.rendimientoHectarea.forEach(item => {
      const cumplimiento = ((item.rendimiento / item.objetivo) * 100).toFixed(2);
      wsRendimiento.addRow([item.mes, item.rendimiento, item.objetivo, cumplimiento]);
    });

    // Hoja 2: Eficiencia por Campo
    const wsEficiencia = workbook.addWorksheet('Eficiencia Campos');
    wsEficiencia.addRow(['Campo', 'Eficiencia (%)', 'Meta (%)', 'Estado']);
    datos.eficienciaCampos.forEach(campo => {
      const estado = campo.eficiencia >= campo.meta ? 'Cumple' : 'No cumple';
      wsEficiencia.addRow([campo.campo, campo.eficiencia, campo.meta, estado]);
    });

    // Hoja 3: Rendimiento por Trabajador
    const wsTrabajadores = workbook.addWorksheet('Rendimiento Trabajadores');
    wsTrabajadores.addRow(['Trabajador', 'Rendimiento Promedio (kg/h)', 'Total Labores', 'Eficiencia (%)']);
    datos.rendimientoPorTrabajador.forEach(trabajador => {
      wsTrabajadores.addRow([trabajador.trabajador, trabajador.rendimiento_promedio, trabajador.total_labores, trabajador.eficiencia]);
    });
  }

  private static generarContenidoCostosExcel(workbook: ExcelJS.Workbook, datos: DatosCostos): void {
    // Hoja 1: Costos por Actividad
    const wsCostos = workbook.addWorksheet('Costos por Actividad');
    wsCostos.addRow(['Mes', 'Siembra', 'Riego', 'Fertilización', 'Cosecha', 'Mantenimiento', 'Total']);
    datos.costosPorActividad.forEach(item => {
      wsCostos.addRow([item.mes, item.siembra, item.riego, item.fertilizacion, item.cosecha, item.mantenimiento, item.total]);
    });

    // Hoja 2: Resumen de Costos
    const wsResumen = workbook.addWorksheet('Resumen Costos');
    wsResumen.addRow(['Categoría', 'Total (USD)']);
    wsResumen.addRow(['Personal', datos.resumenCostos.totalPersonal]);
    wsResumen.addRow(['Insumos', datos.resumenCostos.totalInsumos]);
    wsResumen.addRow(['Transporte', datos.resumenCostos.totalTransporte]);
    wsResumen.addRow(['Mantenimiento', datos.resumenCostos.totalMantenimiento]);
    wsResumen.addRow(['Total General', datos.resumenCostos.totalGeneral]);
    wsResumen.addRow(['Variación Mensual (%)', datos.resumenCostos.variacionMensual]);
  }

  private static generarContenidoCalidadExcel(workbook: ExcelJS.Workbook, datos: DatosCalidad): void {
    // Hoja 1: Calidad por Mes
    const wsCalidad = workbook.addWorksheet('Calidad por Mes');
    wsCalidad.addRow(['Mes', 'Excelente (%)', 'Buena (%)', 'Regular (%)', 'Mala (%)']);
    datos.calidadProduccion.forEach(item => {
      wsCalidad.addRow([item.mes, item.excelente, item.buena, item.regular, item.mala]);
    });

    // Hoja 2: Resumen de Calidad
    const wsResumen = workbook.addWorksheet('Resumen Calidad');
    wsResumen.addRow(['Categoría', 'Promedio (%)']);
    wsResumen.addRow(['Excelente', datos.resumenCalidad.promedioExcelente.toFixed(2)]);
    wsResumen.addRow(['Buena', datos.resumenCalidad.promedioBuena.toFixed(2)]);
    wsResumen.addRow(['Regular', datos.resumenCalidad.promedioRegular.toFixed(2)]);
    wsResumen.addRow(['Mala', datos.resumenCalidad.promedioMala.toFixed(2)]);
    wsResumen.addRow(['Tendencia', datos.resumenCalidad.tendencia]);
  }

  // Obtener nombres de hojas según el tipo de reporte
  private static getSheetNames(tipoReporte: string): string[] {
    switch (tipoReporte) {
      case 'Productividad':
        return ['Estadísticas', 'Producción Mensual', 'Distribución Cultivos'];
      case 'Rendimiento':
        return ['Rendimiento', 'Eficiencia Campos', 'Rendimiento Trabajadores'];
      case 'Costos':
        return ['Costos por Actividad', 'Resumen Costos'];
      case 'Calidad':
        return ['Calidad por Mes', 'Resumen Calidad'];
      default:
        return [];
    }
  }
}