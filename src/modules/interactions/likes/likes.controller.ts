import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { ToggleLikeDto, LikeTargetType } from './dto/toggle-like.dto';
import { JwtAuthGuard } from 'src//modules/auth/guards/jwt-auth.guard'; // ⚠️ Adjust this path if your guard is located elsewhere!

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // POST /api/v1/likes
  @Post()
  @UseGuards(JwtAuthGuard) // Requires the user to be logged in
  @HttpCode(HttpStatus.OK)
  async toggleLike(@Request() req, @Body() dto: ToggleLikeDto) {
    // req.user.id is populated by your JWT guard
    return this.likesService.toggleLike(req.user.id, dto);
  }

  // GET /api/v1/likes/count?targetType=BOOK&targetId=123-uuid
  @Get('count')
  async getLikeCount(
    @Query('targetType') targetType: LikeTargetType,
    @Query('targetId') targetId: string,
  ) {
    return this.likesService.getLikeCount(targetType, targetId);
  }
}
