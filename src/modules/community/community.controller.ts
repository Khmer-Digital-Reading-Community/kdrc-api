import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommendations')
  getRecommendations(@Req() req, @Query('limit') limit?: string) {
    return this.service.getRecommendations(
      req.user.id,
      limit ? parseInt(limit, 10) : 12,
    );
  }
}
