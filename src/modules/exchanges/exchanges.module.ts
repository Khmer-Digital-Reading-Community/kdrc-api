import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';
import { ExchangeRequestsController } from './exchange-requests.controller';
import { ExchangeRequestsService } from './exchange-requests.service';
import { ExchangeRequest } from './entities/exchange-request.entity';
import { Exchange } from './entities/exchange.entity';
import { ExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exchange, ExchangeRequest]),
    CloudinaryModule,
  ],
  controllers: [ExchangesController, ExchangeRequestsController],
  providers: [ExchangesService, ExchangeRequestsService],
  exports: [ExchangesService, ExchangeRequestsService],
})
export class ExchangesModule {}
