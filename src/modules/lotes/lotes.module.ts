import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LotesController } from './lotes.controller';
import { LotesService } from './lotes.service';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [LotesController],
  providers: [LotesService],
  exports: [LotesService],
})
export class LotesModule {}
