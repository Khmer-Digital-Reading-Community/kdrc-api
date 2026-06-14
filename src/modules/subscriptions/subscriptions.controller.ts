import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { SubscribeDto } from './dto/subscribe.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ── Plans (public read, admin write) ──

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: Partial<CreatePlanDto>) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.deletePlan(id);
  }

  // ── User subscriptions ──

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(@Req() req, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(
      req.user.id,
      dto.planId,
      dto.autoRenew ?? true,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancel(@Req() req) {
    return this.subscriptionsService.cancel(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMySubscription(@Req() req) {
    return this.subscriptionsService.getMySubscription(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check')
  checkSubscription(@Req() req) {
    return this.subscriptionsService.checkSubscription(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('renew/toggle')
  toggleAutoRenew(@Req() req) {
    return this.subscriptionsService.toggleAutoRenew(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getPaymentHistory(@Req() req) {
    return this.subscriptionsService.getPaymentHistory(req.user.id);
  }
}
