import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentSessionsService } from './payment-sessions.service';
import { InitiatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentSessionsController {
  constructor(private readonly paymentSessionsService: PaymentSessionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sessions')
  createSession(@Req() req, @Body() dto: InitiatePaymentDto) {
    return this.paymentSessionsService.createSession(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions/:id')
  getSession(@Req() req, @Param('id') id: string) {
    return this.paymentSessionsService.getSession(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/confirm')
  confirmSession(@Req() req, @Param('id') id: string) {
    return this.paymentSessionsService.confirmSession(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/cancel')
  cancelSession(@Req() req, @Param('id') id: string) {
    return this.paymentSessionsService.cancelSession(id, req.user.id);
  }
}
