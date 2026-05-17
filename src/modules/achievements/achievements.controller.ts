import {
  Controller, Get, Post, Param, Body,
  UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly service: AchievementsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateAchievementDto) {
    return this.service.create(dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMy(@Request() req) {
    return this.service.getMyAchievements(req.user.id);
  }

  @Post(':id/award')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  award(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.service.awardAchievement(req.user.id, id);
  }
}
