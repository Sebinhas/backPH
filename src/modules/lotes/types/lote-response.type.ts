// Types para datos de la entidad Lote
export type LoteData = {
  id: string;
  key: string;
  grupo: string;
  sigla: string;
  nombre: string;
  fincaId: number;
  keyValue: number;
  tipoSujetoId: number;
  tipoCultivoId: number;
};

// Types para respuestas de API siguiendo patrón obligatorio
export type LotesResponse = {
  status: number;
  message: string;
  data?: LoteData | LoteData[];
};

// Type para datos de la API externa SIOMA
export type SiomaLoteData = {
  key: string;
  grupo: string;
  sigla: string;
  nombre: string;
  finca_id: number;
  key_value: number;
  tipo_sujeto_id: number;
  tipo_cultivo_id: number;
};
