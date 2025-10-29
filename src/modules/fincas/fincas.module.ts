import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FincasController } from './fincas.controller';
import { FincasService } from './fincas.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [FincasController],
  providers: [FincasService],
  exports: [FincasService],
})
export class FincasModule {}
