// Modelos para el Dashboard basados en la estructura real de la base de datos

export interface EstadisticaAgricola {
  totalProduccion: number;
  totalArea: number;
  rendimientoPromedio: number;
  variacionSemanal: number;
  variacionMensual: number;
  proyeccionRendimiento: number;
  camposActivos: number;
  cultivosEnProceso: number;
  eficienciaPromedio: number;
}

export interface ProduccionMensual {
  mes: string;
  cafe: number;
  cana: number;
  maiz: number;
  platano: number;
  total: number;
}

export interface RendimientoPorHectarea {
  mes: string;
  rendimiento: number;
  objetivo: number;
}

export interface DistribucionCultivo {
  nombre: string;
  area: number;
  porcentaje: number;
  produccion: number;
  color: string;
}

export interface EficienciaCampo {
  campo: string;
  eficiencia: number;
  meta: number;
}

export interface LaborDiaria {
  dia: string;
  cosecha: number;
  riego: number;
  fertilizacion: number;
  transporte: number;
}

export interface CalidadProduccion {
  mes: string;
  excelente: number;
  buena: number;
  regular: number;
  mala: number;
}

// Nuevas interfaces para gráficas adicionales
export interface ActividadesPlanificadas {
  mes: string;
  pendientes: number;
  en_progreso: number;
  completadas: number;
  atrasadas: number;
  canceladas: number;
}

export interface TrabajadoresPorCargo {
  cargo: string;
  cantidad: number;
  activos: number;
  inactivos: number;
  color: string;
}

export interface TiposLaborFrecuentes {
  tipo: string;
  cantidad: number;
  categoria: string;
  porcentaje: number;
  color: string;
}

export interface EstadoLotes {
  estado: string;
  cantidad: number;
  area_total: number;
  porcentaje: number;
  color: string;
}

export interface RendimientoPorTrabajador {
  trabajador: string;
  rendimiento_promedio: number;
  total_labores: number;
  eficiencia: number;
}

export interface CostosPorActividad {
  mes: string;
  siembra: number;
  riego: number;
  fertilizacion: number;
  cosecha: number;
  mantenimiento: number;
  total: number;
}

// Modelos de datos base para consultas
export interface LaborData {
  id: number;
  fecha: Date;
  cultivo: string;
  lote: string;
  peso_total: number;
  rendimiento_por_hora: number;
  estado: string;
  tipo_labor_id: number;
  trabajador_id: number;
}

export interface LoteData {
  id: number;
  nombre: string;
  area_hectareas: number;
  estado: string;
  cultivo_id: number;
}

export interface CultivoData {
  id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
}

export interface TipoLaborData {
  id: number;
  nombre: string;
  categoria: string;
}

export interface TrabajadorData {
  id: number;
  nombres: string;
  apellidos: string;
  cargo: string;
  estado: string;
}

// Interfaces para consultas agregadas
export interface ProduccionPorMes {
  mes_key: string;
  cafe: number;
  cana: number;
  maiz: number;
  platano: number;
  total: number;
}

export interface RendimientoPorMes {
  mes_key: string;
  produccion_total: number;
  area_total: number;
  rendimiento_real: number;
}

export interface EficienciaPorLote {
  campo: string;
  eficiencia: number;
  total_labores: number;
  labores_completadas: number;
}

export interface LaboresPorDia {
  dia_key: string;
  cosecha: number;
  riego: number;
  fertilizacion: number;
  transporte: number;
}

export interface CalidadPorMes {
  mes_key: string;
  rendimiento_promedio: number;
  total_labores: number;
  desviacion_estandar: number;
}

// Interfaces para respuestas de API
export interface DashboardResponse {
  estadisticas: EstadisticaAgricola;
  produccionMensual: ProduccionMensual[];
  rendimientoHectarea: RendimientoPorHectarea[];
  distribucionCultivos: DistribucionCultivo[];
  eficienciaCampos: EficienciaCampo[];
  laboresDiarias: LaborDiaria[];
  calidadProduccion: CalidadProduccion[];
  // Nuevas gráficas
  actividadesPlanificadas: ActividadesPlanificadas[];
  trabajadoresPorCargo: TrabajadoresPorCargo[];
  tiposLaborFrecuentes: TiposLaborFrecuentes[];
  estadoLotes: EstadoLotes[];
  rendimientoPorTrabajador: RendimientoPorTrabajador[];
  costosPorActividad: CostosPorActividad[];
}

// Interfaces para filtros y parámetros
export interface DashboardFilters {
  fechaInicio?: Date;
  fechaFin?: Date;
  cultivoId?: number;
  loteId?: number;
  trabajadorId?: number;
}

export interface DashboardParams {
  periodo?: 'semana' | 'mes' | 'trimestre' | 'año';
  cultivo?: string;
  lote?: string;
}
