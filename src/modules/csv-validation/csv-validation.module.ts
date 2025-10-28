import { Module } from '@nestjs/common';
import { CsvValidationController } from './csv-validation.controller';
import { CsvValidationService } from './csv-validation.service';

@Module({
  controllers: [CsvValidationController],
  providers: [CsvValidationService],
})
export class CsvValidationModule {}

