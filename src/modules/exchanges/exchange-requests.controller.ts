import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExchangeRequestDto } from './dto/create-exchange-request.dto';
import { ScheduleMeetingDto } from './dto/schedule-meeting.dto';
import { ExchangeRequestsService } from './exchange-requests.service';

@Controller('exchange-requests')
export class ExchangeRequestsController {
  constructor(
    private readonly exchangeRequestsService: ExchangeRequestsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateExchangeRequestDto) {
    return this.exchangeRequestsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('incoming')
  findIncoming(@Req() req) {
    return this.exchangeRequestsService.findIncoming(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Req() req) {
    return this.exchangeRequestsService.findMine(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  hasPending(
    @Req() req,
    @Query('exchangeId') exchangeId: string,
  ) {
    return this.exchangeRequestsService.hasPendingRequest(
      exchangeId,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.exchangeRequestsService.findOne(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/accept')
  accept(@Req() req, @Param('id') id: string) {
    return this.exchangeRequestsService.accept(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reject')
  reject(@Req() req, @Param('id') id: string) {
    return this.exchangeRequestsService.reject(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Req() req, @Param('id') id: string) {
    return this.exchangeRequestsService.cancel(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/schedule')
  schedule(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: ScheduleMeetingDto,
  ) {
    return this.exchangeRequestsService.schedule(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  complete(@Req() req, @Param('id') id: string) {
    return this.exchangeRequestsService.complete(id, req.user.id);
  }
}
