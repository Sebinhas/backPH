// Modelos para el módulo de Reportes

export interface ReporteRequest {
  tipoReporte: 'Productividad' | 'Rendimiento' | 'Costos';
  fechaInicio?: Date;
  fechaFin?: Date;
  cultivoId?: number;
  loteId?: number;
  trabajadorId?: number;
}

export interface ReporteResponse {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  generatedAt: string;
  sheets?: string[];
  tipoReporte: string;
}

export interface ReporteDisponible {
  id: string;
  nombre: string;
  descripcion: string;
  formatos: ('PDF' | 'Excel')[];
  icono: string;
  color: string;
}

// Interfaces para datos de reportes
export interface DatosProductividad {
  estadisticas: {
    totalProduccion: number;
    totalArea: number;
    rendimientoPromedio: number;
    camposActivos: number;
    cultivosEnProceso: number;
    eficienciaPromedio: number;
    variacionMensual: number;
    variacionSemanal: number;
  };
  produccionMensual: Array<{
    mes: string;
    cafe: number;
    cana: number;
    maiz: number;
    platano: number;
    total: number;
  }>;
  distribucionCultivos: Array<{
    nombre: string;
    area: number;
    porcentaje: number;
    produccion: number;
    color: string;
  }>;
}

export interface DatosRendimiento {
  rendimientoHectarea: Array<{
    mes: string;
    rendimiento: number;
    objetivo: number;
  }>;
  eficienciaCampos: Array<{
    campo: string;
    eficiencia: number;
    meta: number;
  }>;
  rendimientoPorTrabajador: Array<{
    trabajador: string;
    rendimiento_promedio: number;
    total_labores: number;
    eficiencia: number;
  }>;
}

export interface DatosCostos {
  costosPorActividad: Array<{
    mes: string;
    siembra: number;
    riego: number;
    fertilizacion: number;
    cosecha: number;
    mantenimiento: number;
    total: number;
  }>;
  resumenCostos: {
    totalPersonal: number;
    totalInsumos: number;
    totalTransporte: number;
    totalMantenimiento: number;
    totalGeneral: number;
    variacionMensual: number;
  };
}

export interface DatosCalidad {
  calidadProduccion: Array<{
    mes: string;
    excelente: number;
    buena: number;
    regular: number;
    mala: number;
  }>;
  resumenCalidad: {
    promedioExcelente: number;
    promedioBuena: number;
    promedioRegular: number;
    promedioMala: number;
    tendencia: 'mejorando' | 'estable' | 'empeorando';
  };
}

export interface DatosComparativo {
  resumenEjecutivo: {
    totalProduccion: number;
    variacionMensual: number;
    eficienciaPromedio: number;
    camposActivos: number;
    cultivoDestacado: string;
    rendimientoDestacado: number;
  };
  mejoresDesempenos: {
    mejorCultivo: string;
    mejorCampo: string;
    mejorTrabajador: string;
    mejorMes: string;
  };
  recomendaciones: string[];
  proyecciones: {
    produccionProyectada: number;
    costosProyectados: number;
    eficienciaProyectada: number;
  };
}

// Interfaces para filtros
export interface FiltrosReporte {
  fechaInicio?: Date;
  fechaFin?: Date;
  cultivoId?: number;
  loteId?: number;
  trabajadorId?: number;
  periodo?: 'semana' | 'mes' | 'trimestre' | 'año';
}

// Interfaces para respuestas de API
export interface ReportesDisponiblesResponse {
  success: boolean;
  data: ReporteDisponible[];
}

export interface GenerarReporteResponse {
  success: boolean;
  data: ReporteResponse;
}
