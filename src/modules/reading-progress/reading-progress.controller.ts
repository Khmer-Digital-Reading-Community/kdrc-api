import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Req, ParseUUIDPipe,
  Inject,
} from '@nestjs/common';
import { ReadingProgressService } from './reading-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpsertProgressDto } from './dto/upsert-progress.dto';

@Controller('reading-progress')
export class ReadingProgressController {
  constructor(private service: ReadingProgressService) {}
  

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req) {
    return this.service.findByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  upsert(@Body() dto: UpsertProgressDto, @Req() req) {
    return this.service.upsert(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats(@Req() req) {
    return this.service.getUserStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity')
  getActivity(@Req() req) {
    return this.service.getActivity(req.user.id);
  }

  @Get('leaderboard')
  getLeaderboard(@Query('sort') sort?: string) {
    const validSorts = ['books', 'streak', 'pages'] as const;
    const s = validSorts.includes(sort as any) ? (sort as 'books' | 'streak' | 'pages') : 'books';
    return this.service.getLeaderboard(s);
  }
}
