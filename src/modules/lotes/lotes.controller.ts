import { Controller, Get, Param, ParseIntPipe, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LotesService } from './lotes.service';
import { LotesResponse } from './types';

@ApiTags('Lotes')
@Controller('lotes')
export class LotesController {
  private readonly logger = new Logger(LotesController.name);

  constructor(private readonly lotesService: LotesService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los lotes',
    description: 'Obtiene la lista completa de lotes desde el sistema SIOMA'
  })
  @ApiResponse({
    status: 200,
    description: 'Lotes obtenidos exitosamente',
    schema: {
      example: {
        status: 200,
        message: 'Lotes obtenidos exitosamente',
        data: [
          {
            id: '33986',
            key: 'lote_id',
            grupo: '4 - Palmita',
            sigla: '4-PLM',
            nombre: '84-MANCHIS',
            fincaId: 2372,
            keyValue: 33986,
            tipoSujetoId: 3,
            tipoCultivoId: 2,
            createdAt: '2025-01-02T12:00:00.000Z',
            updatedAt: '2025-01-02T12:00:00.000Z'
          },
          {
            id: '33987',
            key: 'lote_id',
            grupo: '4 - Palmita',
            sigla: '4-PLM',
            nombre: '85-CANDELARIA',
            fincaId: 2372,
            keyValue: 33987,
            tipoSujetoId: 3,
            tipoCultivoId: 2,
            createdAt: '2025-01-02T12:00:00.000Z',
            updatedAt: '2025-01-02T12:00:00.000Z'
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontraron lotes',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontraron lotes en el sistema SIOMA',
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
  async findAll(): Promise<LotesResponse> {
    this.logger.log('Solicitud para obtener todos los lotes');
    return this.lotesService.findAll();
  }

  @Get(':keyValue')
  @ApiOperation({
    summary: 'Obtener lote por key_value',
    description: 'Obtiene un lote específico basado en su key_value desde el sistema SIOMA'
  })
  @ApiParam({
    name: 'keyValue',
    type: Number,
    description: 'Valor clave del lote',
    example: 33986,
  })
  @ApiResponse({
    status: 200,
    description: 'Lote obtenido exitosamente',
    schema: {
      example: {
        status: 200,
        message: 'Lote obtenido exitosamente',
        data: {
          id: '33986',
          key: 'lote_id',
          grupo: '4 - Palmita',
          sigla: '4-PLM',
          nombre: '84-MANCHIS',
          fincaId: 2372,
          keyValue: 33986,
          tipoSujetoId: 3,
          tipoCultivoId: 2,
          createdAt: '2025-01-02T12:00:00.000Z',
          updatedAt: '2025-01-02T12:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Lote no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontró el lote con key_value: 9999',
        error: 'Not Found'
      }
    }
  })
  async findOne(@Param('keyValue', ParseIntPipe) keyValue: number): Promise<LotesResponse> {
    this.logger.log(`Solicitud para obtener lote con key_value: ${keyValue}`);
    return this.lotesService.findOne(keyValue);
  }
}
