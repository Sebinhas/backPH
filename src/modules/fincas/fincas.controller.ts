import { Controller, Get, Param, ParseIntPipe, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FincasService } from './fincas.service';
import { FincasResponse } from './types';

@ApiTags('Fincas')
@Controller('fincas')
export class FincasController {
  private readonly logger = new Logger(FincasController.name);

  constructor(private readonly fincasService: FincasService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las fincas',
    description: 'Obtiene la lista completa de fincas desde el sistema SIOMA'
  })
  @ApiResponse({
    status: 200,
    description: 'Fincas obtenidas exitosamente',
    schema: {
      example: {
        status: 200,
        message: 'Fincas obtenidas exitosamente',
        data: [
          {
            id: 'finca_2372',
            key: 'finca_id',
            grupo: 'Prueba_Fincas',
            sigla: 'PRB_F',
            moneda: 'COP',
            nombre: '4 - Palmita',
            pagoDia: 47450,
            keyValue: 2372,
            tipoSujetoId: 1,
            tipoCultivoId: 2,
            createdAt: '2025-01-02T12:00:00.000Z',
            updatedAt: '2025-01-02T12:00:00.000Z'
          },
          {
            id: 'finca_2373',
            key: 'finca_id',
            grupo: 'Prueba_Fincas',
            sigla: 'PRB_F',
            moneda: 'COP',
            nombre: '4 - Camelias',
            pagoDia: 47450,
            keyValue: 2373,
            tipoSujetoId: 1,
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
    description: 'No se encontraron fincas',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontraron fincas en el sistema SIOMA',
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
  async findAll(): Promise<FincasResponse> {
    this.logger.log('Solicitud para obtener todas las fincas');
    return this.fincasService.findAll();
  }

  @Get(':keyValue')
  @ApiOperation({
    summary: 'Obtener finca por key_value',
    description: 'Obtiene una finca específica basada en su key_value desde el sistema SIOMA'
  })
  @ApiParam({
    name: 'keyValue',
    type: Number,
    description: 'Valor clave de la finca',
    example: 2372,
  })
  @ApiResponse({
    status: 200,
    description: 'Finca obtenida exitosamente',
    schema: {
      example: {
        status: 200,
        message: 'Finca obtenida exitosamente',
        data: {
          id: 'finca_2372',
          key: 'finca_id',
          grupo: 'Prueba_Fincas',
          sigla: 'PRB_F',
          moneda: 'COP',
          nombre: '4 - Palmita',
          pagoDia: 47450,
          keyValue: 2372,
          tipoSujetoId: 1,
          tipoCultivoId: 2,
          createdAt: '2025-01-02T12:00:00.000Z',
          updatedAt: '2025-01-02T12:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Finca no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'No se encontró la finca con key_value: 9999',
        error: 'Not Found'
      }
    }
  })
  async findOne(@Param('keyValue', ParseIntPipe) keyValue: number): Promise<FincasResponse> {
    this.logger.log(`Solicitud para obtener finca con key_value: ${keyValue}`);
    return this.fincasService.findOne(keyValue);
  }
}
