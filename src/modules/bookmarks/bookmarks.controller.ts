import { Controller, Post, Get, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookmarkType } from './bookmark.entity';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard) 
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}


  @Post()
  async add(
    @Query('type') type: BookmarkType,
    @Query('targetId') targetId: string,
    @Request() req,
  ) {
    this.validateQueryParams(type, targetId);
    return this.bookmarksService.addBookmark(req.user.id, type, targetId);
  }

  // GET /bookmarks
  @Get()
  async list(@Request() req) {
    return this.bookmarksService.getMyBookmarks(req.user.id);
  }


  @Delete()
  async remove(
    @Query('type') type: BookmarkType,
    @Query('targetId') targetId: string,
    @Request() req,
  ) {
    this.validateQueryParams(type, targetId);
    return this.bookmarksService.removeBookmark(req.user.id, type, targetId);
  }


  private validateQueryParams(type: BookmarkType, targetId: string) {
    if (!type || !targetId) {
      throw new BadRequestException('Missing parameters. Both "type" and "targetId" are required.');
    }
    if (!Object.values(BookmarkType).includes(type)) {
      throw new BadRequestException('Invalid type parameter value. Must be BOOK or CHAPTER.');
    }
  }
}