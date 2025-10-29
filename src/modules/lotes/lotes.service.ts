import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LotesResponse, SiomaLoteData, LoteData } from './types';

@Injectable()
export class LotesService {
  private readonly logger = new Logger(LotesService.name);
  private readonly siomaApiUrl: string;
  private readonly siomaAccessToken: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const siomaApiUrl = this.configService.get<string>('SIOMA_API_URL');
    const siomaAccessToken = this.configService.get<string>('SIOMA_ACCESS_TOKEN');
    
    if (!siomaApiUrl) {
      this.logger.error('SIOMA_API_URL no está configurada en las variables de entorno');
      throw new Error('SIOMA_API_URL es requerida para el funcionamiento del servicio');
    }
    
    if (!siomaAccessToken) {
      this.logger.warn('SIOMA_ACCESS_TOKEN no está configurada. Las peticiones pueden fallar por autenticación.');
    }
    
    this.siomaApiUrl = siomaApiUrl;
    this.siomaAccessToken = siomaAccessToken || '';
  }

  /**
   * Obtiene todos los lotes desde la API de SIOMA
   */
  async findAll(): Promise<LotesResponse> {
    try {
      this.logger.log('Consultando lotes desde API SIOMA');

      // Construir URL del endpoint
      const endpoint = `${this.siomaApiUrl}/4/usuarios/sujetos`;
      
      // Preparar headers según documentación SIOMA
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'tipo-sujetos': '[3]', // Filtrar solo lotes según documentación
      };

      // Agregar access token si está disponible
      if (this.siomaAccessToken) {
        headers['Authorization'] = `${this.siomaAccessToken}`;
      }

      // Realizar petición a la API externa usando fetch nativo
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const siomaLotes = await response.json() as SiomaLoteData[];
      this.logger.log(`Se obtuvieron ${siomaLotes.length} lotes desde SIOMA`);

      // Transformar datos de SIOMA a formato interno
      const lotesData: LoteData[] = siomaLotes.map(this.transformSiomaToLoteData);

      return {
        status: 200,
        message: 'Lotes obtenidos exitosamente',
        data: lotesData,
      };

    } catch (error) {
      this.logger.error('Error al consultar lotes desde SIOMA:', error.message);
      
      if (error.message.includes('401')) {
        throw new HttpException(
          'Error de autenticación con la API SIOMA. Verifica las credenciales configuradas.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      
      if (error.message.includes('404')) {
        throw new HttpException(
          'No se encontraron lotes en el sistema SIOMA',
          HttpStatus.NOT_FOUND,
        );
      }
      
      if (error.message.includes('500')) {
        throw new HttpException(
          'Error interno del servidor SIOMA',
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(
        'Error al consultar lotes desde el sistema externo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un lote específico por key_value
   */
  async findOne(keyValue: number): Promise<LotesResponse> {
    try {
      this.logger.log(`Consultando lote con key_value: ${keyValue}`);

      const endpoint = `${this.siomaApiUrl}/4/usuarios/sujetos`;
      
      // Preparar headers según documentación SIOMA
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'tipo-sujetos': '[3]', // Filtrar solo lotes según documentación
      };

      // Agregar access token si está disponible
      if (this.siomaAccessToken) {
        headers['Authorization'] = `${this.siomaAccessToken}`;
      }

      // Realizar petición a la API externa usando fetch nativo
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const siomaLotes = await response.json() as SiomaLoteData[];
      const lote = siomaLotes.find(l => l.key_value === keyValue);

      if (!lote) {
        throw new HttpException(
          `No se encontró el lote con key_value: ${keyValue}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const loteData = this.transformSiomaToLoteData(lote);

      return {
        status: 200,
        message: 'Lote obtenido exitosamente',
        data: loteData,
      };

    } catch (error) {
      this.logger.error(`Error al consultar lote ${keyValue}:`, error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.message.includes('401')) {
        throw new HttpException(
          'Error de autenticación con la API SIOMA. Verifica las credenciales configuradas.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new HttpException(
        'Error al consultar el lote desde el sistema externo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transforma datos de SIOMA a formato interno de LoteData
   */
  private transformSiomaToLoteData(siomaLote: SiomaLoteData): LoteData {
    return {
      id: siomaLote.key_value.toString(), // Generar ID único basado en key_value
      key: siomaLote.key,
      grupo: siomaLote.grupo,
      sigla: siomaLote.sigla,
      nombre: siomaLote.nombre,
      fincaId: siomaLote.finca_id,
      keyValue: siomaLote.key_value,
      tipoSujetoId: siomaLote.tipo_sujeto_id,
      tipoCultivoId: siomaLote.tipo_cultivo_id
    };
  }
}
