import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoordenadasResponse } from './types';

@Injectable()
export class CoordenadasService {
  private readonly logger = new Logger(CoordenadasService.name);
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
   * Obtiene los puntos (coordenadas) usando solo lote_id
   */
  async findByLote(loteId: number): Promise<CoordenadasResponse> {
    try {
      this.logger.log(`Consultando coordenadas del lote ${loteId} (ID) desde API SIOMA`);

      const endpoint = `${this.siomaApiUrl}/4/puntos_lotes?lote_id=${loteId}`;
      
      return await this.fetchCoordenadas(endpoint, loteId, undefined);

    } catch (error) {
      this.logger.error('Error al consultar coordenadas desde SIOMA:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene los puntos (coordenadas) usando solo lote_name
   */
  async findByLoteName(loteName: string): Promise<CoordenadasResponse> {
    try {
      this.logger.log(`Consultando coordenadas del lote "${loteName}" (nombre) desde API SIOMA`);

      const endpoint = `${this.siomaApiUrl}/4/puntos_lotes?lote_name=${encodeURIComponent(loteName)}`;
      
      return await this.fetchCoordenadas(endpoint, loteName, undefined);

    } catch (error) {
      this.logger.error('Error al consultar coordenadas desde SIOMA:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene los puntos (coordenadas) usando solo usuario_id
   */
  async findByUsuario(usuarioId: number): Promise<CoordenadasResponse> {
    try {
      this.logger.log(`Consultando coordenadas para usuario ${usuarioId} desde API SIOMA`);

      const endpoint = `${this.siomaApiUrl}/4/puntos_lotes?usuario_id=${usuarioId}`;
      
      return await this.fetchCoordenadas(endpoint, undefined, usuarioId);

    } catch (error) {
      this.logger.error('Error al consultar coordenadas desde SIOMA:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene los puntos (coordenadas) de un lote específico desde la API de SIOMA usando lote_id y usuario_id
   */
  async findByLoteAndUsuario(loteId: number, usuarioId: number): Promise<CoordenadasResponse> {
    try {
      this.logger.log(`Consultando coordenadas del lote ${loteId} (ID) para usuario ${usuarioId} desde API SIOMA`);

      const endpoint = `${this.siomaApiUrl}/4/puntos_lotes?lote_id=${loteId}&usuario_id=${usuarioId}`;
      
      return await this.fetchCoordenadas(endpoint, loteId, usuarioId);

    } catch (error) {
      this.logger.error('Error al consultar coordenadas desde SIOMA:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene los puntos (coordenadas) de un lote específico desde la API de SIOMA usando lote_name y usuario_id
   */
  async findByLoteNameAndUsuario(loteName: string, usuarioId: number): Promise<CoordenadasResponse> {
    try {
      this.logger.log(`Consultando coordenadas del lote "${loteName}" (nombre) para usuario ${usuarioId} desde API SIOMA`);

      const endpoint = `${this.siomaApiUrl}/4/puntos_lotes?lote_name=${encodeURIComponent(loteName)}&usuario_id=${usuarioId}`;
      
      return await this.fetchCoordenadas(endpoint, loteName, usuarioId);

    } catch (error) {
      this.logger.error('Error al consultar coordenadas desde SIOMA:', error.message);
      throw error;
    }
  }

  /**
   * Método privado para realizar la petición a la API de SIOMA
   */
  private async fetchCoordenadas(
    endpoint: string,
    loteIdentifier?: number | string,
    usuarioId?: number,
  ): Promise<CoordenadasResponse> {
    try {
      // Preparar headers de autenticación
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
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
        const error = new Error(`HTTP error! status: ${response.status}`);
        this.handleError(error, loteIdentifier, usuarioId);
      }

      const siomaPuntos = await response.json();
      
      // Validar que la respuesta sea un array
      const puntosArray = Array.isArray(siomaPuntos) ? siomaPuntos : [siomaPuntos];
      
      const logMessage = loteIdentifier 
        ? `Se obtuvieron ${puntosArray.length} coordenadas desde SIOMA para lote ${loteIdentifier}`
        : `Se obtuvieron ${puntosArray.length} coordenadas desde SIOMA para usuario ${usuarioId}`;
      
      this.logger.log(logMessage);

      // Devolver datos tal cual vienen de la API sin transformación
      return {
        status: 200,
        message: 'Coordenadas obtenidas exitosamente',
        data: puntosArray,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error al consultar coordenadas desde SIOMA:', error.message);
      this.handleError(error as Error, loteIdentifier, usuarioId);
    }
  }

  /**
   * Maneja errores de petición a la API de SIOMA
   */
  private handleError(error: Error, loteIdentifier?: number | string, usuarioId?: number): never {
    if (error.message.includes('401')) {
      throw new HttpException(
        'Error de autenticación con la API SIOMA. Verifica las credenciales configuradas.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    
    if (error.message.includes('404')) {
      let message = 'No se encontraron coordenadas';
      if (loteIdentifier && usuarioId) {
        message = `No se encontraron coordenadas para el lote "${loteIdentifier}" y usuario ${usuarioId}`;
      } else if (loteIdentifier) {
        message = `No se encontraron coordenadas para el lote "${loteIdentifier}"`;
      } else if (usuarioId) {
        message = `No se encontraron coordenadas para el usuario ${usuarioId}`;
      }
      
      throw new HttpException(message, HttpStatus.NOT_FOUND);
    }
    
    if (error.message.includes('500')) {
      throw new HttpException(
        'Error interno del servidor SIOMA',
        HttpStatus.BAD_GATEWAY,
      );
    }

    throw new HttpException(
      'Error al consultar coordenadas desde el sistema externo',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

}

