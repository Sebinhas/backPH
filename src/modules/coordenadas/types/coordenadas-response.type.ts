// Types para respuestas de API siguiendo patrón obligatorio
// Los datos se devuelven tal cual vienen de la API sin transformación
export type CoordenadasResponse = {
  status: number;
  message: string;
  data?: any; // Datos sin tipado estricto, tal cual vienen de SIOMA
};

