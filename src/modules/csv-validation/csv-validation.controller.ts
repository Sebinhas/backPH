import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CsvValidationService } from './csv-validation.service';
import { ValidationResponse } from './types/validation-response.type';

@ApiTags('Validación CSV')
@Controller('csv-validation')
export class CsvValidationController {
  constructor(private readonly csvValidationService: CsvValidationService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiOperation({
    summary: 'Validar archivo CSV de palmas',
    description:
      'Valida un archivo CSV con datos de palmas contra errores comunes como coordenadas duplicadas, líneas repetidas, etc.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo CSV a validar',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Validación exitosa',
    schema: {
      example: {
        isValid: false,
        errors: [
          {
            type: 'Coordenadas duplicadas',
            description: 'Las coordenadas 3.884461687000, -73.642684 aparecen en las filas: 2, 5',
            rows: [2, 5],
            count: 2,
          },
        ],
        message: 'Se encontraron 1 tipo(s) de error(es) en el archivo',
      },
    },
  })
  async validateCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ValidationResponse> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    // Validar que sea un archivo CSV
    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('El archivo debe ser un CSV');
    }

    const result = await this.csvValidationService.validateCsv(file.buffer);

    return result;
  }
}

