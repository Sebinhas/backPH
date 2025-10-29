import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FincasResponse, SiomaFincaData, FincaData } from './types';

@Injectable()
export class FincasService {
  private readonly logger = new Logger(FincasService.name);
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
   * Obtiene todas las fincas desde la API de SIOMA
   */
  async findAll(): Promise<FincasResponse> {
    try {
      this.logger.log('Consultando fincas desde API SIOMA');

      // Construir URL del endpoint
      const endpoint = `${this.siomaApiUrl}/4/usuarios/sujetos`;
      
      // Preparar headers de autenticación
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'tipo-sujetos': '[1]' // 1 = Persona Jurídica, 2 = Persona Natural
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

      const siomaFincas = await response.json() as SiomaFincaData[];
      this.logger.log(`Se obtuvieron ${siomaFincas.length} fincas desde SIOMA`);

      // Transformar datos de SIOMA a formato interno
      const fincasData: FincaData[] = siomaFincas.map(this.transformSiomaToFincaData);

      return {
        status: 200,
        message: 'Fincas obtenidas exitosamente',
        data: fincasData,
      };

    } catch (error) {
      this.logger.error('Error al consultar fincas desde SIOMA:', error.message);
      
      if (error.message.includes('401')) {
        throw new HttpException(
          'Error de autenticación con la API SIOMA. Verifica las credenciales configuradas.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      
      if (error.message.includes('404')) {
        throw new HttpException(
          'No se encontraron fincas en el sistema SIOMA',
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
        'Error al consultar fincas desde el sistema externo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene una finca específica por key_value
   */
  async findOne(keyValue: number): Promise<FincasResponse> {
    try {
      this.logger.log(`Consultando finca con key_value: ${keyValue}`);

      const endpoint = `${this.siomaApiUrl}/4/usuarios/sujetos`;
      
      // Preparar headers según documentación SIOMA
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'tipo-sujetos': '[1]', // Filtrar solo fincas según documentación
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

      const siomaFincas = await response.json() as SiomaFincaData[];
      const finca = siomaFincas.find(f => f.key_value === keyValue);

      if (!finca) {
        throw new HttpException(
          `No se encontró la finca con key_value: ${keyValue}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const fincaData = this.transformSiomaToFincaData(finca);

      return {
        status: 200,
        message: 'Finca obtenida exitosamente',
        data: fincaData,
      };

    } catch (error) {
      this.logger.error(`Error al consultar finca ${keyValue}:`, error.message);
      
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
        'Error al consultar la finca desde el sistema externo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transforma datos de SIOMA a formato interno de FincaData
   */
  private transformSiomaToFincaData(siomaFinca: SiomaFincaData): FincaData {
    return {
      id: siomaFinca.key_value.toString(), // Generar ID único basado en key_value
      key: siomaFinca.key,
      grupo: siomaFinca.grupo,
      sigla: siomaFinca.sigla,
      moneda: siomaFinca.moneda,
      nombre: siomaFinca.nombre,
      pagoDia: siomaFinca.pago_dia,
      keyValue: siomaFinca.key_value,
      tipoSujetoId: siomaFinca.tipo_sujeto_id,
      tipoCultivoId: siomaFinca.tipo_cultivo_id
    };
  }
}
