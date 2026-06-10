import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType } from '../notifications/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Achievement } from './achievement.entity';
import { UserAchievement } from './user-achievement.entity';
import { CreateAchievementDto } from './dto/create-achievement.dto';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(): Promise<Achievement[]> {
    return this.achievementRepo.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  findByName(name: string): Promise<Achievement | null> {
    return this.achievementRepo.findOneBy({ name });
  }

  findByCategory(category: string): Promise<Achievement[]> {
    return this.achievementRepo.findBy({ category });
  }

  create(dto: CreateAchievementDto): Promise<Achievement> {
    const achievement = this.achievementRepo.create(dto);
    return this.achievementRepo.save(achievement);
  }

  async getMyAchievements(userId: string): Promise<any[]> {
    const all = await this.achievementRepo.find();
    const earned = await this.userAchievementRepo.find({
      where: { userId },
    });

    const earnedMap = new Map(earned.map((e) => [e.achievementId, e]));

    return all.map((a) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id)?.earnedAt || null,
    }));
  }

  async awardAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const existing = await this.userAchievementRepo.findOne({
      where: { userId, achievementId },
    });
    if (existing) return existing;

    const achievement = await this.achievementRepo.findOneBy({ id: achievementId });
    if (!achievement) throw new NotFoundException('Achievement not found');

    const ua = this.userAchievementRepo.create({ userId, achievementId });
    const saved = await this.userAchievementRepo.save(ua);

    await this.notificationsService.create({
      title: 'Achievement Unlocked',
      message: `You unlocked the "${achievement.name}" achievement!`,
      type: NotificationType.ACHIEVEMENT_EARNED,
      recipientId: userId,
    });

    return saved;
  }
}
