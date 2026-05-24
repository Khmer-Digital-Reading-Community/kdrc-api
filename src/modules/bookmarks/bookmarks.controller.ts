import { Controller, Post, Get, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookmarkType } from './bookmark.entity';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('bookmarks')

@Controller('bookmarks')
@UseGuards(JwtAuthGuard) 
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}


  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new bookmark (Book or Chapter)' })
  async add(
    @Query() queryDto: CreateBookmarkDto,
    @Request() req,
  ) {
    return this.bookmarksService.addBookmark(req.user.id, queryDto.type, queryDto.targetId);
  }

  // GET /bookmarks
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch all bookmarks saved by the user' })
  async list(@Request() req) {
    return this.bookmarksService.getMyBookmarks(req.user.id);
  }


  @Delete()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a bookmark from your collection' })
  async remove(
    @Query() queryDto: CreateBookmarkDto,
    @Request() req,
  ) {
    return this.bookmarksService.removeBookmark(req.user.id, queryDto.type, queryDto.targetId);
  }

}