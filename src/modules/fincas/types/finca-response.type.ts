// Types para datos de la entidad Finca
export type FincaData = {
  id: string;
  key: string;
  grupo: string;
  sigla: string;
  moneda: string;
  nombre: string;
  pagoDia: number;
  keyValue: number;
  tipoSujetoId: number;
  tipoCultivoId: number;
};

// Types para respuestas de API siguiendo patrón obligatorio
export type FincasResponse = {
  status: number;
  message: string;
  data?: FincaData | FincaData[];
};

// Type para datos de la API externa SIOMA
export type SiomaFincaData = {
  key: string;
  grupo: string;
  sigla: string;
  moneda: string;
  nombre: string;
  pago_dia: number;
  key_value: number;
  tipo_sujeto_id: number;
  tipo_cultivo_id: number;
};
