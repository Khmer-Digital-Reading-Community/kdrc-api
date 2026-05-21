import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto, UpdateChapterDto, ChapterResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Chapters Controller
 * Manages chapter-related operations for books
 *
 * @remarks
 * GET /chapters/book/:bookId - Fetch all chapters for a book
 * POST /chapters - Create a new chapter
 * PATCH /chapters/:id - Update a chapter
 * DELETE /chapters/:id - Delete a chapter
 */
@Controller('chapters')
export class ChaptersController {
  constructor(private chaptersService: ChaptersService) {}

  /**
   * Get all chapters for a specific book
   *
   * @param bookId - The UUID of the book
   * @returns Array of chapters sorted by order and chapter number
   *
   * @example
   * GET /chapters/book/123e4567-e89b-12d3-a456-426614174000
   * Response: [
   *   {
   *     "id": "chapter-uuid",
   *     "title": "Chapter 1",
   *     "chapterNumber": 1,
   *     "order": 0,
   *     "type": "CHAPTER",
   *     "description": "First chapter"
   *   }
   * ]
   *
   * @throws NotFoundException if book doesn't exist
   * @throws BadRequestException if bookId format is invalid
   */
  @Get('book/:bookId')
  async getChaptersByBookId(
    @Param('bookId') bookId: string,
  ): Promise<ChapterResponseDto[]> {
    return this.chaptersService.getChaptersByBookId(bookId);
  }

  /**
   * Create a new chapter
   *
   * @param dto - Chapter creation data
   * @param req - Request object containing authenticated user info
   * @returns Created chapter
   *
   * @example
   * POST /chapters
   * Body: {
   *   "title": "Chapter 1",
   *   "content": "Chapter content...",
   *   "chapterNumber": 1,
   *   "bookId": "book-uuid",
   *   "order": 0
   * }
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() dto: CreateChapterDto,
    @Req() req,
  ): Promise<ChapterResponseDto> {
    return this.chaptersService.create(dto);
  }

  /**
   * Update an existing chapter
   *
   * @param id - Chapter ID
   * @param dto - Chapter update data
   * @param req - Request object containing authenticated user info
   * @returns Updated chapter
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
    @Req() req,
  ): Promise<ChapterResponseDto> {
    return this.chaptersService.update(id, dto);
  }

  /**
   * Delete a chapter
   *
   * @param id - Chapter ID
   * @param req - Request object containing authenticated user info
   * @returns Success message
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    return this.chaptersService.delete(id);
  }
}
