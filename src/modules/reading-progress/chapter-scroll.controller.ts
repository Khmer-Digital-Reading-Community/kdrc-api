import {
  Controller, Get, Post, Param, Body,
  UseGuards, Req, ParseUUIDPipe,
} from '@nestjs/common';
import { ChapterScrollService } from './chapter-scroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpsertChapterScrollDto } from './dto/upsert-chapter-scroll.dto';

@Controller('chapter-progress')
export class ChapterScrollController {
  constructor(private service: ChapterScrollService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  upsert(@Body() dto: UpsertChapterScrollDto, @Req() req) {
    return this.service.upsert(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('book/:bookId')
  findByBook(@Param('bookId', ParseUUIDPipe) bookId: string, @Req() req) {
    return this.service.findByBook(req.user.id, bookId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':chapterId')
  findOne(
    @Param('chapterId', ParseUUIDPipe) chapterId: string,
    @Req() req,
  ) {
    return this.service.findOne(req.user.id, chapterId);
  }
}
