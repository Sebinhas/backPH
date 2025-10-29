import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { FincasModule } from './modules/fincas/fincas.module';
import { LotesModule } from './modules/lotes/lotes.module';
import { CoordenadasModule } from './modules/coordenadas/coordenadas.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    FincasModule,
    LotesModule,
    CoordenadasModule,
  ],
})
export class AppModule {}
