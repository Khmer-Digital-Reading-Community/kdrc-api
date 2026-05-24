import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly service: ChallengesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMy(@Request() req) {
    return this.service.getMyChallenges(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateChallengeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChallengeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.service.join(req.user.id, id);
  }

  @Patch(':id/progress')
  @UseGuards(JwtAuthGuard)
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgressDto,
    @Request() req,
  ) {
    return this.service.updateProgress(req.user.id, id, dto);
  }
}
