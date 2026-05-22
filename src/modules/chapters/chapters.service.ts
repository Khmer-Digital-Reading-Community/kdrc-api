import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { Book } from '../books/book.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { ReadingProgress } from '../reading-progress/reading-progress.entity';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chaptersRepository: Repository<Chapter>,

    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,

    @InjectRepository(ReadingProgress)
    private readonly progressRepository: Repository<ReadingProgress>,
  ) {}

  async findAll(bookId: string) {
    return this.chaptersRepository.find({
      where: { book: { id: bookId } },
      order: { chapterNumber: 'ASC' },
    });
  }

  async findOne(id: string) {
    const chapter = await this.chaptersRepository.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }

  async create(dto: CreateChapterDto) {
    const book = await this.booksRepository.findOne({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const chapter = this.chaptersRepository.create({
      title: dto.title,
      content: dto.content,
      chapterNumber: dto.chapterNumber,
      book,
    });

    const saved = await this.chaptersRepository.save(chapter);

    await this.recalculateProgress(dto.bookId);

    return saved;
  }

  async remove(id: string) {
    const chapter = await this.chaptersRepository.findOne({
      where: { id },
      relations: ['book'],
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    const bookId = chapter.book.id;
    await this.chaptersRepository.remove(chapter);
    await this.recalculateProgress(bookId);
  }

  private async recalculateProgress(bookId: string) {
    const totalChapters = await this.chaptersRepository.count({
      where: { book: { id: bookId } },
    });

    const progresses = await this.progressRepository.find({
      where: { book: { id: bookId } },
      relations: ['chapter'],
    });

    for (const p of progresses) {
      if (p.chapter) {
        p.percentageCompleted = Math.round(
          (p.chapter.chapterNumber / totalChapters) * 100,
        );
      } else {
        p.percentageCompleted = 0;
      }
    }

    if (progresses.length) {
      await this.progressRepository.save(progresses);
    }
  }
}
