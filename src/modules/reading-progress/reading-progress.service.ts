import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingProgress } from './reading-progress.entity';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Book } from '../books/book.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { ChallengesService } from '../challenges/challenges.service';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private repo: Repository<ReadingProgress>,

    @InjectRepository(Book)
    private bookRepo: Repository<Book>,

    @InjectRepository(Chapter)
    private chaptersRepo: Repository<Chapter>,

    private achievementsService: AchievementsService,
    private challengesService: ChallengesService,
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

    const previousPercentage = existing?.percentageCompleted ?? 0;

    if (existing) {
      existing.percentageCompleted = percentageCompleted;
      existing.lastReadAt = new Date();
      if (dto.chapterId) existing.chapter = { id: dto.chapterId } as any;
      await this.repo.save(existing);
    } else {
      const progress = this.repo.create({
        user: { id: userId } as any,
        book: { id: dto.bookId } as any,
        chapter: dto.chapterId ? ({ id: dto.chapterId } as any) : undefined,
        percentageCompleted,
      });
      await this.repo.save(progress);
    }

    await this.checkStreakAchievements(userId);

    if (
      percentageCompleted >= 100 &&
      previousPercentage < 100
    ) {
      await this.updateChallengeProgressOnBookComplete(userId).catch(() => {});
    }

    return existing ?? await this.repo.findOne({
      where: { user: { id: userId }, book: { id: dto.bookId } },
    });
  }

  private async updateChallengeProgressOnBookComplete(userId: string) {
    const myChallenges = await this.challengesService.getMyChallenges(userId);
    for (const challenge of myChallenges) {
      if (!challenge.expired && !challenge.completedAt) {
        await this.challengesService.updateProgress(userId, challenge.id, {
          completedBooks: (challenge.completedBooks ?? 0) + 1,
        }).catch(() => {});
      }
    }
  }

  private async checkStreakAchievements(userId: string) {
    const all = await this.repo.find({
      where: { user: { id: userId } },
    });
    const streak = this.calculateStreak(all);
    const uniqueBooks = new Set(all.map((p) => p.book?.id)).size;

    const names: string[] = [];
    if (streak >= 7) names.push('7-Day Streak');
    if (streak >= 30) names.push('30-Day Streak');
    if (streak >= 1) names.push('Streak Reader');
    if (uniqueBooks >= 1) names.push('First Chapter');
    if (uniqueBooks >= 10) names.push('Bookworm');
    if (uniqueBooks >= 25) names.push('Bibliophile');

    for (const name of names) {
      const achievement = await this.achievementsService.findByName(name);
      if (achievement) {
        await this.achievementsService.awardAchievement(userId, achievement.id).catch(() => {});
      }
    }
  }

  async getUserStats(userId: string) {
    const all = await this.repo.find({
      where: { user: { id: userId } },
      relations: ['book', 'book.genre'],
    });

    const uniqueBooks = new Set(all.map((p) => p.book?.id)).size;

    const totalPages = all.reduce((sum, p) => {
      return sum + (p.percentageCompleted / 100) * 300;
    }, 0);

    const streak = this.calculateStreak(all);

    const genreMap = new Map<string, { name: string; count: number; color: string }>();
    const genreColors = ['#1c3a2e', '#3a5fa5', '#7a3d92', '#c5a050', '#0f6e56', '#a04040', '#2d6b5e', '#d4a574'];
    let gi = 0;
    for (const p of all) {
      const genreName = p.book?.genre?.name || 'Other';
      if (!genreMap.has(genreName)) {
        genreMap.set(genreName, { name: genreName, count: 0, color: genreColors[gi++ % genreColors.length] });
      }
      genreMap.get(genreName)!.count++;
    }

    const totalBooks = uniqueBooks || 1;
    const genres = Array.from(genreMap.values())
      .map((g) => ({ ...g, pct: Math.round((g.count / totalBooks) * 100) }))
      .sort((a, b) => b.count - a.count);

    return {
      booksRead: uniqueBooks,
      currentStreak: streak,
      totalPages: Math.round(totalPages),
      totalEntries: all.length,
      genres,
    };
  }

  async getActivity(userId: string) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const all = await this.repo.find({
      where: { user: { id: userId } },
      select: ['lastReadAt'],
    });

    const dayCount = new Map<string, number>();
    for (const entry of all) {
      const d = new Date(entry.lastReadAt);
      if (d >= sixtyDaysAgo) {
        const key = d.toISOString().slice(0, 10);
        dayCount.set(key, (dayCount.get(key) || 0) + 1);
      }
    }

    // Build 8 weeks of data starting from a Monday
    const weeks: { date: string; count: number }[][] = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 55);
    start.setDate(start.getDate() - start.getDay() + 1);

    for (let w = 0; w < 8; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(date.getDate() + w * 7 + d);
        const key = date.toISOString().slice(0, 10);
        week.push({ date: key, count: dayCount.get(key) || 0 });
      }
      weeks.push(week);
    }

    return { weeks };
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
