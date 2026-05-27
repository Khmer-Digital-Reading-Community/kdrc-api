import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  // Param,
  // Delete,
} from '@nestjs/common';
import { ExchangesService } from './exchanges.service';
import { CreateExchangeDto } from './dto/create-exchange.dto';
// import { UpdateExchangeDto } from './dto/update-exchange.dto';

@Controller('exchanges')
export class ExchangesController {
  constructor(private readonly exchangesService: ExchangesService) {}

  @Post()
  create(@Body() createExchangeDto: CreateExchangeDto) {
    return this.exchangesService.create(createExchangeDto);
  }

  @Get()
  findAll() {
    return this.exchangesService.findAll();
  }
}
