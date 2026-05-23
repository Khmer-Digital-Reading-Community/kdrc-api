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
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ChaptersService } from './chapters.service';
import {
  CreateChapterDto,
  UpdateChapterDto,
  ChapterResponseDto,
  ChapterContentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Chapters Controller
 * Manages chapter-related operations for books
 *
 * @remarks
 * GET /chapters/book/:bookId - Fetch all chapters for a book
 * GET /chapters/:id/content - Fetch full content for a single chapter (cached)
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
   * Get full content for a single chapter
   * Includes formatted content, word count, and reading time estimate
   * Response is cached for 1 hour (3600 seconds) to optimize content loading
   *
   * @param id - The UUID of the chapter
   * @returns Full chapter content with metadata
   *
   * @example
   * GET /chapters/chapter-uuid/content
   * Response: {
   *   "id": "chapter-uuid",
   *   "title": "Chapter 1: Introduction",
   *   "content": "Full chapter text here...",
   *   "chapterNumber": 1,
   *   "wordCount": 2500,
   *   "readingTimeMinutes": 11,
   *   "bookId": "book-uuid",
   *   "type": "CHAPTER",
   *   "order": 0,
   *   "createdAt": "2024-01-15T10:30:00Z",
   *   "updatedAt": "2024-01-15T10:30:00Z"
   * }
   *
   * @throws NotFoundException if chapter doesn't exist
   * @throws BadRequestException if chapter ID format is invalid
   */
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // Cache for 1 hour
  @Get(':id/content')
  async getChapterContent(@Param('id') id: string): Promise<ChapterContentDto> {
    return this.chaptersService.getChapterContent(id);
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
