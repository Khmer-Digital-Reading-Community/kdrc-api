import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './challenge.entity';
import { UserChallenge } from './user-challenge.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(UserChallenge)
    private readonly userChallengeRepo: Repository<UserChallenge>,
  ) {}

  findAll(): Promise<Challenge[]> {
    return this.challengeRepo.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<Challenge> {
    return this.challengeRepo.findOneOrFail({ where: { id } });
  }

  create(dto: CreateChallengeDto): Promise<Challenge> {
    const challenge = this.challengeRepo.create(dto);
    return this.challengeRepo.save(challenge);
  }

  async update(id: string, dto: UpdateChallengeDto): Promise<Challenge> {
    const challenge = await this.challengeRepo.findOneBy({ id });
    if (!challenge) throw new NotFoundException('Challenge not found');
    Object.assign(challenge, dto);
    return this.challengeRepo.save(challenge);
  }

  async remove(id: string): Promise<void> {
    const result = await this.challengeRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Challenge not found');
  }

  async join(userId: string, challengeId: string): Promise<UserChallenge> {
    const existing = await this.userChallengeRepo.findOne({
      where: { userId, challengeId },
    });
    if (existing) throw new ConflictException('Already joined this challenge');

    const challenge = await this.challengeRepo.findOneBy({ id: challengeId });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const uc = this.userChallengeRepo.create({ userId, challengeId });
    return this.userChallengeRepo.save(uc);
  }

  async getMyChallenges(userId: string): Promise<any[]> {
    const userChallenges = await this.userChallengeRepo.find({
      where: { userId },
      relations: ['challenge'],
      order: { joinedAt: 'DESC' },
    });

    return userChallenges.map((uc) => ({
      ...uc.challenge,
      joinedAt: uc.joinedAt,
      completedBooks: uc.completedBooks,
      completedAt: uc.completedAt,
    }));
  }

  async updateProgress(
    userId: string,
    challengeId: string,
    dto: UpdateProgressDto,
  ): Promise<UserChallenge> {
    const uc = await this.userChallengeRepo.findOne({
      where: { userId, challengeId },
      relations: ['challenge'],
    });
    if (!uc) throw new NotFoundException('You have not joined this challenge');

    uc.completedBooks = dto.completedBooks;

    if (uc.challenge && dto.completedBooks >= uc.challenge.targetBooks) {
      uc.completedAt = new Date();
    } else {
      uc.completedAt = undefined as any;
    }

    return this.userChallengeRepo.save(uc);
  }
}
