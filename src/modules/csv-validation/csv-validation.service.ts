import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { ValidationError, ValidationResponse } from './types/validation-response.type';

@Injectable()
export class CsvValidationService {
  private readonly logger = new Logger(CsvValidationService.name);
  private readonly geminiModel: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_KEY no configurado');
    }
    this.geminiModel = new GoogleGenerativeAI(apiKey || 'dummy-key');
  }

  async validateCsv(fileBuffer: Buffer): Promise<ValidationResponse> {
    try {
      // Parsear CSV a JSON
      const csvData = await this.parseCsvToJson(fileBuffer);
      
      if (!csvData || csvData.length === 0) {
        return {
          isValid: false,
          message: 'El archivo CSV está vacío o no tiene datos válidos',
        };
      }

      // Dividir en chunks de 1000 registros si el archivo es grande
      const chunkSize = 1000;
      const chunks: any[][] = [];
      
      for (let i = 0; i < csvData.length; i += chunkSize) {
        chunks.push(csvData.slice(i, i + chunkSize));
      }

      this.logger.log(`Archivo dividido en ${chunks.length} chunk(s) de máximo ${chunkSize} registros`);

      // Validar cada chunk y acumular errores
      let allErrors: ValidationError[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        this.logger.log(`Validando chunk ${i + 1}/${chunks.length}...`);
        
        // Validar coordenadas duplicadas localmente primero
        const coordErrors = this.validateCoordinates(chunks[i], i);
        this.logger.log(`Errores de coordenadas en chunk ${i + 1}: ${coordErrors.length}`);
        
        // Validar con Gemini
        const geminiErrors = await this.validateWithGemini(chunks[i], i);
        this.logger.log(`Errores de Gemini en chunk ${i + 1}: ${geminiErrors.length}`);
        
        // Acumular todos los errores del chunk
        allErrors = [...allErrors, ...coordErrors, ...geminiErrors];
      }
      
      if (allErrors.length > 0) {
        return {
          isValid: false,
          errors: allErrors,
          message: `Se encontraron ${allErrors.length} tipo(s) de error(es) en el archivo`,
        };
      }

      return {
        isValid: true,
        message: 'El archivo CSV es válido y no contiene errores',
      };
    } catch (error) {
      this.logger.error('Error validando CSV:', error);
      return {
        isValid: false,
        message: `Error al validar el archivo: ${error.message}`,
      };
    }
  }

  private async parseCsvToJson(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer.toString());
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private validateCoordinates(data: any[], chunkIndex: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const rowOffset = chunkIndex * 1000;

    // Validar coordenadas duplicadas
    const coordMap = new Map<string, number[]>();
    data.forEach((row, index) => {
      const lat = row.Latitud?.trim() || row.Lat?.trim();
      const lon = row.Longitu?.trim() || row.Long?.trim();
      const coordKey = `${lat}_${lon}`;
      
      if (lat && lon) {
        const realRow = rowOffset + index + 2; // +2 porque la fila 1 es el header y index empieza en 0
        if (coordMap.has(coordKey)) {
          coordMap.get(coordKey)!.push(realRow);
        } else {
          coordMap.set(coordKey, [realRow]);
        }
      }
    });

    // Agregar errores de coordenadas duplicadas
    coordMap.forEach((rows, coordKey) => {
      if (rows.length > 1) {
        const [lat, lon] = coordKey.split('_');
        errors.push({
          type: 'Coordenadas duplicadas',
          description: `Las coordenadas ${lat}, ${lon} aparecen en las filas: ${rows.join(', ')}`,
          rows: rows,
          count: rows.length,
        });
      }
    });

    return errors;
  }

  private async validateWithGemini(data: any[], chunkIndex: number = 0): Promise<ValidationError[]> {
    if (!process.env.GEMINI_KEY) {
      this.logger.warn('Gemini API Key no configurado, omitiendo validación avanzada');
      return [];
    }

    try {
      const model = this.geminiModel.getGenerativeModel({ model: 'gemini-pro' });
      
      // Calcular el offset de filas basado en el chunk
      const rowOffset = chunkIndex * 1000;
      
      const prompt = `
Analiza el siguiente CSV de datos de palmas y valida ESTRICTAMENTE estos errores:

1. **Líneas duplicadas en lote**: Dentro del mismo lote, no deben repetirse líneas
2. **Posiciones de palma duplicadas en línea**: Dentro de la misma línea, no deben repetirse posiciones de palma
3. **Coordenadas fuera de rango**: Validar que las coordenadas sean lógicas (latitud -90 a 90, longitud -180 a 180)
4. **Lotes inválidos o con formato inconsistente**: Todos los lotes deben tener un formato válido

Datos del CSV (${data.length} registros):
${JSON.stringify(data, null, 2)}

IMPORTANTE: Los números de fila REALES son del ${rowOffset + 2} al ${rowOffset + data.length + 1} (suma ${rowOffset + 2} al índice del registro).

Si encuentras errores, responde ÚNICAMENTE con un array JSON en este formato exacto:
[
  {
    "type": "Líneas duplicadas en lote",
    "description": "En el lote \"X\", la línea \"Y\" aparece en las filas: A, B",
    "rows": [número REAL de fila 1, número REAL de fila 2],
    "count": 2
  },
  {
    "type": "Posiciones de palma duplicadas en línea",
    "description": "En el lote \"X\", línea \"Y\", la palma \"Z\" aparece en las filas: A, B",
    "rows": [número REAL de fila 1, número REAL de fila 2],
    "count": 2
  }
]

Si no hay errores, responde únicamente con: []

IMPORTANTE: Solo devuelve el JSON, sin texto adicional, sin markdown.
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Limpiar la respuesta de markdown si viene envuelta
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const errors: ValidationError[] = JSON.parse(cleanResponse);
      return errors;
    } catch (error) {
      this.logger.error(`Error en validación con Gemini (chunk ${chunkIndex + 1}):`, error);
      return [];
    }
  }
}
