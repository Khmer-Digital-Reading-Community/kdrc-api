import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './chapter.entity';
import { Book } from '../books/book.entity';
import { CreateChapterDto, UpdateChapterDto, ChapterResponseDto, ChapterContentDto } from './dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private chaptersRepo: Repository<Chapter>,

    @InjectRepository(Book)
    private booksRepo: Repository<Book>,
  ) {}

  /**
   * Get all chapters for a specific book
   * @param bookId - UUID of the book
   * @returns Array of chapters sorted by chapter number and order, or empty array if book exists but has no chapters
   * @throws NotFoundException if book doesn't exist
   * @throws BadRequestException if bookId is invalid
   */
  async getChaptersByBookId(bookId: string): Promise<ChapterResponseDto[]> {
    // Validate bookId format (basic UUID validation)
    if (!bookId || typeof bookId !== 'string' || bookId.trim() === '') {
      throw new BadRequestException('Invalid book ID format');
    }

    // Check if book exists
    const book = await this.booksRepo.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    // Fetch chapters for the book, sorted by order and chapter number
    const chapters = await this.chaptersRepo.find({
      where: { bookId },
      order: {
        order: 'ASC',
        chapterNumber: 'ASC',
        createdAt: 'ASC',
      },
    });

    // Map to response DTO and return (can be empty array)
    return chapters.map((chapter) => this.mapToResponseDto(chapter));
  }

  /**
   * Create a new chapter for a book
   */
  async create(dto: CreateChapterDto): Promise<ChapterResponseDto> {
    // Validate book exists
    const book = await this.booksRepo.findOne({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${dto.bookId} not found`);
    }

    // Check for duplicate chapter number in the same book
    const existingChapter = await this.chaptersRepo.findOne({
      where: {
        bookId: dto.bookId,
        chapterNumber: dto.chapterNumber,
      },
    });

    if (existingChapter) {
      throw new BadRequestException(
        `Chapter ${dto.chapterNumber} already exists for this book`,
      );
    }

    const chapter = this.chaptersRepo.create(dto);
    const savedChapter = await this.chaptersRepo.save(chapter);

    return this.mapToResponseDto(savedChapter);
  }

  /**
   * Update an existing chapter
   */
  async update(id: string, dto: UpdateChapterDto): Promise<ChapterResponseDto> {
    const chapter = await this.chaptersRepo.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    // If updating chapter number, check for duplicates in the same book
    if (
      dto.chapterNumber &&
      dto.chapterNumber !== chapter.chapterNumber
    ) {
      const existingChapter = await this.chaptersRepo.findOne({
        where: {
          bookId: chapter.bookId,
          chapterNumber: dto.chapterNumber,
        },
      });

      if (existingChapter) {
        throw new BadRequestException(
          `Chapter ${dto.chapterNumber} already exists for this book`,
        );
      }
    }

    Object.assign(chapter, dto);
    const updatedChapter = await this.chaptersRepo.save(chapter);

    return this.mapToResponseDto(updatedChapter);
  }

  /**
   * Delete a chapter
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const chapter = await this.chaptersRepo.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    await this.chaptersRepo.remove(chapter);

    return {
      success: true,
      message: 'Chapter deleted successfully',
    };
  }

  /**
   * Map Chapter entity to response DTO
   */
  private mapToResponseDto(chapter: Chapter): ChapterResponseDto {
    return {
      id: chapter.id,
      title: chapter.title,
      chapterNumber: chapter.chapterNumber,
      order: chapter.order,
      type: chapter.type,
      description: chapter.description,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }

  /**
   * Get full content for a single chapter
   * Validates chapter ID, loads content, and calculates metadata
   *
   * @param chapterId - UUID of the chapter
   * @returns Full chapter content with metadata (word count, reading time)
   * @throws NotFoundException if chapter doesn't exist
   * @throws BadRequestException if chapter ID is invalid
   */
  async getChapterContent(chapterId: string): Promise<ChapterContentDto> {
    // Validate chapter ID format
    if (!chapterId || typeof chapterId !== 'string' || chapterId.trim() === '') {
      throw new BadRequestException('Invalid chapter ID format');
    }

    // Query for chapter - will be null if not found
    const chapter = await this.chaptersRepo.findOne({
      where: { id: chapterId },
      relations: ['book'],
    });

    // Handle chapter not found
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }

    // Calculate word count from content
    const wordCount = this.calculateWordCount(chapter.content);

    // Calculate reading time (average reading speed: 200-250 words per minute)
    const readingTimeMinutes = Math.ceil(wordCount / 225);

    // Format and return chapter content
    return this.mapToContentDto(chapter, wordCount, readingTimeMinutes);
  }

  /**
   * Calculate word count from content text
   * Handles various text formats and edge cases
   *
   * @param content - The content text to analyze
   * @returns Total number of words
   */
  private calculateWordCount(content: string): number {
    if (!content) {
      return 0;
    }

    // Split by whitespace and filter out empty strings
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    return words.length;
  }

  /**
   * Map Chapter entity to content DTO with metadata
   *
   * @param chapter - The chapter entity
   * @param wordCount - Calculated word count
   * @param readingTimeMinutes - Calculated reading time
   * @returns Formatted chapter content DTO
   */
  private mapToContentDto(
    chapter: Chapter,
    wordCount: number,
    readingTimeMinutes: number,
  ): ChapterContentDto {
    return {
      id: chapter.id,
      title: chapter.title,
      content: chapter.content,
      chapterNumber: chapter.chapterNumber,
      order: chapter.order,
      type: chapter.type,
      description: chapter.description,
      bookId: chapter.bookId,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      wordCount,
      readingTimeMinutes,
    };
  }
}
