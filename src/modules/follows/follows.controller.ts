import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  follow(@Req() req, @Body() dto: CreateFollowDto) {
    return this.followsService.follow(req.user.id, dto.followingId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':followingId')
  unfollow(@Req() req, @Param('followingId') followingId: string) {
    return this.followsService.unfollow(req.user.id, followingId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check/:userId')
  isFollowing(@Req() req, @Param('userId') userId: string) {
    return this.followsService.isFollowing(req.user.id, userId);
  }

  @Get('user/:userId/followers')
  getFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowers(
      userId,
      Number(page ?? '1'),
      Number(limit ?? '20'),
    );
  }

  @Get('user/:userId/following')
  getFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followsService.getFollowing(
      userId,
      Number(page ?? '1'),
      Number(limit ?? '20'),
    );
  }

  @Get('user/:userId/counts')
  getCounts(@Param('userId') userId: string) {
    return this.followsService.getCounts(userId);
  }
}
