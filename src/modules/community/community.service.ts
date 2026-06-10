import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Challenge } from '../challenges/challenge.entity';
import { ReadingProgress } from '../reading-progress/reading-progress.entity';
import { Book } from '../books/book.entity';
import { Review } from '../reviews/review.entity';
import { Genre } from '../genres/entities/genre.entity';
import { Category } from '../categories/category.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(ReadingProgress)
    private readonly progressRepo: Repository<ReadingProgress>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getStats() {
    const totalChallenges = await this.challengeRepo.count();

    const activeReadersResult = await this.progressRepo
      .createQueryBuilder('rp')
      .select('COUNT(DISTINCT rp.userId)', 'count')
      .getRawOne();
    const activeReaders = Number(activeReadersResult?.count || 0);

    const totalBooksRead = await this.progressRepo.count();

    return { totalChallenges, activeReaders, totalBooksRead };
  }

  async getRecommendations(userId: string, limit = 12) {
    const progress = await this.progressRepo.find({
      where: { user: { id: userId } },
      relations: ['chapter', 'chapter.book'],
    });

    const readBookIds = [
      ...new Set(progress.map((p) => p.chapter?.bookId).filter(Boolean)),
    ];

    const userReviews = await this.reviewRepo.find({
      where: { reviewerId: userId },
    });

    const ratedBookIds = userReviews.map((r) => r.bookId).filter(Boolean);
    const excludeIds = [...new Set([...readBookIds, ...ratedBookIds])];

    const likedGenres = userReviews
      .filter((r) => Number(r.rating) >= 4)
      .map((r) => r.bookId);

    if (likedGenres.length > 0) {
      const likedBooks = await this.bookRepo.find({
        where: { id: In(likedGenres as string[]) },
        relations: ['genre'],
      });
      const genreIds = [
        ...new Set(likedBooks.map((b) => b.genre?.id).filter(Boolean)),
      ];

      if (genreIds.length > 0) {
        const recommendations = await this.bookRepo.find({
          where: {
            ...(excludeIds.length > 0 ? { id: Not(In(excludeIds)) } : {}),
            genre: { id: In(genreIds) },
            status: 'PUBLISHED' as any,
          },
          relations: ['author', 'genre'],
          order: { rating: 'DESC', readCount: 'DESC' },
          take: limit,
        });

        if (recommendations.length >= limit) return recommendations;

        const remaining = limit - recommendations.length;
        const recIds = recommendations.map((r) => r.id);
        const moreExclude = [...excludeIds, ...recIds];

        const fallback = await this.bookRepo.find({
          where: {
            ...(moreExclude.length > 0
              ? { id: Not(In(moreExclude)) }
              : {}),
            status: 'PUBLISHED' as any,
          },
          relations: ['author', 'genre'],
          order: { rating: 'DESC', readCount: 'DESC' },
          take: remaining,
        });

        return [...recommendations, ...fallback];
      }
    }

    return this.bookRepo.find({
      where: {
        ...(excludeIds.length > 0 ? { id: Not(In(excludeIds)) } : {}),
        status: 'PUBLISHED' as any,
      },
      relations: ['author', 'genre'],
      order: { rating: 'DESC', readCount: 'DESC' },
      take: limit,
    });
  }
}
