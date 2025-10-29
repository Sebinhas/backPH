import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoordenadasController } from './coordenadas.controller';
import { CoordenadasService } from './coordenadas.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [CoordenadasController],
  providers: [CoordenadasService],
  exports: [CoordenadasService],
})
export class CoordenadasModule {}

