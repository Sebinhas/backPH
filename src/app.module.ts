import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CsvValidationModule } from './modules/csv-validation/csv-validation.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CsvValidationModule,
  ],
})
export class AppModule {}
