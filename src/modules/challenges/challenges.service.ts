import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { NotificationType } from '../notifications/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AchievementsService } from '../achievements/achievements.service';
import { Challenge } from './challenge.entity';
import { UserChallenge } from './user-challenge.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

const getDeadlineTime = (deadline?: Date | string | null): number | null => {
  if (!deadline) return null;
  if (deadline instanceof Date) return deadline.getTime();
  const parsed = Date.parse(deadline.toString());
  return Number.isNaN(parsed) ? null : parsed;
};

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(UserChallenge)
    private readonly userChallengeRepo: Repository<UserChallenge>,
    private readonly notificationsService: NotificationsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async findAll(): Promise<Challenge[]> {
    await this.autoDeleteExpiredChallenges();
    return this.challengeRepo.find({ order: { createdAt: 'DESC' } });
  }

  private async autoDeleteExpiredChallenges(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.challengeRepo.delete({ deadline: LessThan(today) });
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

  async getParticipants(challengeId: string) {
    const challenge = await this.challengeRepo.findOneBy({ id: challengeId });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const userChallenges = await this.userChallengeRepo.find({
      where: { challengeId },
      relations: ['user'],
      order: { joinedAt: 'DESC' },
    });

    return userChallenges.map((uc) => ({
      id: uc.id,
      userId: uc.userId,
      name: uc.user?.name || 'Unknown',
      email: uc.user?.email,
      avatarUrl: uc.user?.avatarUrl,
      completedBooks: uc.completedBooks,
      joinedAt: uc.joinedAt,
      completedAt: uc.completedAt,
      expired: uc.expired,
    }));
  }

  async join(userId: string, challengeId: string): Promise<UserChallenge> {
    const existing = await this.userChallengeRepo.findOne({
      where: { userId, challengeId },
    });
    if (existing) throw new ConflictException('Already joined this challenge');

    const challenge = await this.challengeRepo.findOneBy({ id: challengeId });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const deadlineTime = getDeadlineTime(challenge.deadline);
    if (deadlineTime !== null && deadlineTime < Date.now()) {
      throw new ConflictException('Cannot join an expired challenge');
    }

    const uc = this.userChallengeRepo.create({ userId, challengeId });
    const saved = await this.userChallengeRepo.save(uc);

    await this.notificationsService.create({
      title: 'Challenge Joined',
      message: `You joined the challenge "${challenge.title}". Good luck!`,
      type: NotificationType.INFO,
      recipientId: userId,
    });

    return saved;
  }

  async getMyChallenges(userId: string): Promise<any[]> {
    await this.autoExpireOverdueChallenges(userId);

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
      expired:
        uc.expired ||
        (!!uc.challenge?.deadline &&
          getDeadlineTime(uc.challenge.deadline) !== null &&
          getDeadlineTime(uc.challenge.deadline)! < Date.now() &&
          !uc.completedAt),
      expiredAt: uc.expiredAt,
    }));
  }

  private async autoExpireOverdueChallenges(userId: string) {
    const overdue = await this.userChallengeRepo.find({
      where: { userId, expired: false },
      relations: ['challenge'],
    });

    const now = new Date();
    for (const uc of overdue) {
      if (uc.completedAt) continue;
      const deadlineTime = getDeadlineTime(uc.challenge?.deadline);
      if (deadlineTime !== null && deadlineTime < now.getTime()) {
        uc.expired = true;
        uc.expiredAt = now;
        await this.userChallengeRepo.save(uc);
        await this.notificationsService.create({
          title: 'Challenge Expired',
          message: `The challenge "${uc.challenge?.title}" has expired before you completed it.`,
          type: NotificationType.WARNING,
          recipientId: userId,
        });
      }
    }
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

    const now = new Date();
    const wasCompleted = Boolean(uc.completedAt);
    const challenge = uc.challenge;

    uc.completedBooks = dto.completedBooks;

    const deadlineTime = getDeadlineTime(challenge?.deadline);
    if (deadlineTime !== null && deadlineTime < now.getTime()) {
      if (!uc.completedAt && !uc.expired) {
        uc.expired = true;
        uc.expiredAt = now;
      }
    }

    let completedNow = false;
    if (challenge && dto.completedBooks >= challenge.targetBooks) {
      if (!wasCompleted) {
        completedNow = true;
      }
      uc.completedAt = now;
      uc.expired = false;
      uc.expiredAt = undefined;
    } else {
      if (!uc.expired) {
        uc.completedAt = undefined as any;
      }
    }

    const saved = await this.userChallengeRepo.save(uc);
    if (completedNow) {
      await this.notificationsService.create({
        title: 'Challenge Completed',
        message: `Congrats! You completed the challenge "${challenge?.title}".`,
        type: NotificationType.SUCCESS,
        recipientId: userId,
      });
    } else if (uc.expired && !wasCompleted) {
      await this.notificationsService.create({
        title: 'Challenge Expired',
        message: `The challenge "${challenge?.title}" has expired before you completed it.`,
        type: NotificationType.WARNING,
        recipientId: userId,
      });
    }

    return saved;
  }
}
