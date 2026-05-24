import { Controller, Post, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path if needed

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':bookId')
  async add(@Param('bookId') bookId: string, @Request() req) {
    // NestJS Passport automatically maps the JWT 'sub' into req.user.id
    return this.bookmarksService.addFavorite(req.user.id, bookId);
  }

  @Get()
  async list(@Request() req) {
    return this.bookmarksService.getMyFavorites(req.user.id);
  }

  @Delete(':bookId')
  async remove(@Param('bookId') bookId: string, @Request() req) {
    return this.bookmarksService.removeFavorite(req.user.id, bookId);
  }
}