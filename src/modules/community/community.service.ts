import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from '../challenges/challenge.entity';
import { ReadingProgress } from '../reading-progress/reading-progress.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(ReadingProgress)
    private readonly progressRepo: Repository<ReadingProgress>,
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
}
