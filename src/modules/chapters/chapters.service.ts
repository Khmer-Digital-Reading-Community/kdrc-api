import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './chapter.entity';
import { Book } from '../books/book.entity';
import { CreateChapterDto, UpdateChapterDto, ChapterResponseDto } from './dto';

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
}
