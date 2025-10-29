import { Controller, Get, Query, ParseIntPipe, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CoordenadasService } from './coordenadas.service';
import { CoordenadasResponse } from './types';

@ApiTags('Coordenadas')
@Controller('coordenadas')
export class CoordenadasController {
  private readonly logger = new Logger(CoordenadasController.name);

  constructor(private readonly coordenadasService: CoordenadasService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener coordenadas',
    description: 'Obtiene las coordenadas (puntos) desde el sistema SIOMA. Puede recibir lote (ID número o nombre string) y/o usuario_id. Al menos uno debe estar presente.'
  })
  @ApiQuery({
    name: 'lote',
    type: String,
    description: 'ID del lote (number) o nombre del lote (string). Si es número, se usa lote_id; si es string, se usa lote_name. Opcional.',
    example: 33986,
    required: false,
  })
  @ApiQuery({
    name: 'usuario_id',
    type: Number,
    description: 'ID del usuario. Opcional.',
    example: 4738,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Coordenadas obtenidas exitosamente',
    schema: {
      example: {
        status: 200,
        message: 'Coordenadas obtenidas exitosamente',
        data: [
          {
            punto_lote_id: 5455283,
            lote_id: 33986,
            lat: '3.854161000000',
            lng: '-73.631380000000',
            created_at: '2025-10-27 16:27:51',
            updated_at: '2025-10-27 16:27:51'
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación: se requiere al menos lote o usuario_id',
    schema: {
      example: {
        statusCode: 400,
        message: 'Se debe proporcionar al menos uno de los siguientes parámetros: lote o usuario_id',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron coordenadas',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontraron coordenadas con los parámetros especificados',
        error: 'Not Found'
      }
    }
  })
  @ApiResponse({
    status: 502,
    description: 'Error del servidor SIOMA',
    schema: {
      example: {
        statusCode: 502,
        message: 'Error interno del servidor SIOMA',
        error: 'Bad Gateway'
      }
    }
  })
  async findCoordenadas(
    @Query('lote') lote?: string,
    @Query('usuario_id') usuarioIdStr?: string,
  ): Promise<CoordenadasResponse> {
    // Validar que al menos uno de los parámetros esté presente
    if (!lote && !usuarioIdStr) {
      throw new BadRequestException(
        'Se debe proporcionar al menos uno de los siguientes parámetros: lote o usuario_id',
      );
    }

    let usuarioId: number | undefined = undefined;

    // Validar y parsear usuario_id si se proporciona
    if (usuarioIdStr) {
      const parsedUsuarioId = Number(usuarioIdStr);
      if (isNaN(parsedUsuarioId)) {
        throw new BadRequestException('usuario_id debe ser un número válido');
      }
      usuarioId = parsedUsuarioId;
    }

    this.logger.log(`Solicitud para obtener coordenadas - lote: "${lote || 'N/A'}", usuario_id: ${usuarioId || 'N/A'}`);

    // Caso 1: Solo lote
    if (lote && !usuarioId) {
      const isNumeric = /^-?\d+$/.test(lote.trim());
      if (isNumeric) {
        const loteId = Number(lote);
        return this.coordenadasService.findByLote(loteId);
      } else {
        return this.coordenadasService.findByLoteName(lote);
      }
    }

    // Caso 2: Solo usuario_id
    if (!lote && usuarioId) {
      return this.coordenadasService.findByUsuario(usuarioId);
    }

    // Caso 3: Ambos parámetros
    if (lote && usuarioId) {
      const isNumeric = /^-?\d+$/.test(lote.trim());
      if (isNumeric) {
        const loteId = Number(lote);
        return this.coordenadasService.findByLoteAndUsuario(loteId, usuarioId);
      } else {
        return this.coordenadasService.findByLoteNameAndUsuario(lote, usuarioId);
      }
    }

    // Este caso no debería alcanzarse debido a la validación inicial
    throw new BadRequestException('Parámetros inválidos');
  }
}

