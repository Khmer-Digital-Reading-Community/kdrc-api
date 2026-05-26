import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingProgress } from './reading-progress.entity';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Book } from '../books/book.entity';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private repo: Repository<ReadingProgress>,

    @InjectRepository(Book)
    private bookRepo: Repository<Book>,

    @InjectRepository(Chapter)
    private chaptersRepo: Repository<Chapter>,
  ) {}


  findByUser(userId: string) {
    return this.repo.find({
      where: { user: { id: userId } },
      relations: ['book', 'book.author', 'chapter'],
      order: { lastReadAt: 'DESC' },
    });
  }

  async upsert(userId: string, dto: UpsertProgressDto) {
    const book = await this.bookRepo.findOne({
      where: { id: dto.bookId },
    });
    if (!book) throw new NotFoundException('Book not found');

    let percentageCompleted = dto.percentageCompleted ?? 0;

    if (dto.chapterId) {
      const chapter = await this.chaptersRepo.findOne({
        where: { id: dto.chapterId },
        relations: ['book'],
      });

      if (!chapter) throw new NotFoundException('Chapter not found');
      if (chapter.book.id !== dto.bookId)
        throw new BadRequestException('Chapter does not belong to this book');

      const totalChapters = await this.chaptersRepo.count({
        where: { book: { id: dto.bookId } },
      });

      if (totalChapters > 0) {
        percentageCompleted = Math.round(
          (chapter.chapterNumber / totalChapters) * 100,
        );
      }
    }

    const existing = await this.repo.findOne({
      where: { user: { id: userId }, book: { id: dto.bookId } },
    });

    if (existing) {
      existing.percentageCompleted = percentageCompleted;
      existing.lastReadAt = new Date();
      if (dto.chapterId) existing.chapter = { id: dto.chapterId } as any;
      return this.repo.save(existing);
    }

    const progress = this.repo.create({
      user: { id: userId } as any,
      book: { id: dto.bookId } as any,
      chapter: dto.chapterId ? ({ id: dto.chapterId } as any) : undefined,
      percentageCompleted,
    });
    return this.repo.save(progress);
  }

  async getUserStats(userId: string) {
    const all = await this.repo.find({
      where: { user: { id: userId } },
      relations: ['book'],
    });

    const uniqueBooks = new Set(all.map((p) => p.book?.id)).size;

    const totalPages = all.reduce((sum, p) => {
      return sum + (p.percentageCompleted / 100) * 300;
    }, 0);

    const streak = this.calculateStreak(all);

    return {
      booksRead: uniqueBooks,
      currentStreak: streak,
      totalPages: Math.round(totalPages),
      totalEntries: all.length,
    };
  }

  async getLeaderboard(sort: 'books' | 'streak' | 'pages' = 'books') {
    const all = await this.repo.find({ relations: ['user', 'book'] });

    const userMap = new Map<string, {
      userId: string;
      name: string;
      books: Set<string>;
      streak: number;
      pages: number;
    }>();

    for (const p of all) {
      if (!p.user) continue;
      if (!userMap.has(p.user.id)) {
        userMap.set(p.user.id, {
          userId: p.user.id,
          name: p.user.name || 'Unknown',
          books: new Set(),
          streak: 0,
          pages: 0,
        });
      }
      const entry = userMap.get(p.user.id)!;
      if (p.book) entry.books.add(p.book.id);
      entry.pages += Math.round((p.percentageCompleted / 100) * 300);
    }

    const leaderboard = Array.from(userMap.values()).map((u) => ({
      name: u.name,
      books: u.books.size,
      streak: u.streak,
      pages: u.pages,
    }));

    leaderboard.sort((a, b) => {
      if (sort === 'streak') return b.streak - a.streak;
      if (sort === 'pages') return b.pages - a.pages;
      return b.books - a.books;
    });

    return leaderboard.slice(0, 50).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  }

  private calculateStreak(entries: ReadingProgress[]): number {
    if (!entries.length) return 0;
    const sorted = entries
      .map((e) => new Date(e.lastReadAt))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 1;
    const today = new Date();
    const diffDays = Math.floor(
      (today.getTime() - sorted[0].getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 1) return 0;

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const diff = Math.floor(
        (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff <= 1) streak++;
      else break;
    }
    return streak;
  }
}
