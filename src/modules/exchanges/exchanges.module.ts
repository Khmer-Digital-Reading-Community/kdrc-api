import { Module } from '@nestjs/common';
import { ExchangesService } from './exchanges.service';
import { ExchangesController } from './exchanges.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exchange } from './entities/exchange.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exchange])],
  controllers: [ExchangesController],
  providers: [ExchangesService],
})
export class ExchangesModule {}
