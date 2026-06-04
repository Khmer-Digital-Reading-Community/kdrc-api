import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChapterScrollProgress } from './chapter-scroll.entity';
import { UpsertChapterScrollDto } from './dto/upsert-chapter-scroll.dto';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Book } from '../books/book.entity';

@Injectable()
export class ChapterScrollService {
  constructor(
    @InjectRepository(ChapterScrollProgress)
    private repo: Repository<ChapterScrollProgress>,

    @InjectRepository(Book)
    private bookRepo: Repository<Book>,

    @InjectRepository(Chapter)
    private chaptersRepo: Repository<Chapter>,
  ) {}

  findByBook(userId: string, bookId: string) {
    return this.repo.find({
      where: { user: { id: userId }, book: { id: bookId } },
      relations: ['chapter'],
      order: { lastReadAt: 'DESC' },
    });
  }

  findOne(userId: string, chapterId: string) {
    return this.repo.findOne({
      where: { user: { id: userId }, chapter: { id: chapterId } },
    });
  }

  async upsert(userId: string, dto: UpsertChapterScrollDto) {
    const book = await this.bookRepo.findOne({ where: { id: dto.bookId } });
    if (!book) throw new NotFoundException('Book not found');

    const chapter = await this.chaptersRepo.findOne({
      where: { id: dto.chapterId },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    const existing = await this.repo.findOne({
      where: {
        user: { id: userId },
        chapter: { id: dto.chapterId },
      },
    });

    if (existing) {
      existing.scrollPercentage = dto.scrollPercentage;
      existing.lastReadAt = new Date();
      return this.repo.save(existing);
    }

    const progress = this.repo.create({
      user: { id: userId } as any,
      book: { id: dto.bookId } as any,
      chapter: { id: dto.chapterId } as any,
      scrollPercentage: dto.scrollPercentage,
    });
    return this.repo.save(progress);
  }
}
