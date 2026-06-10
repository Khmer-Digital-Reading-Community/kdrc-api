import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';
import { UserSubscription } from './user-subscription.entity';
import { User } from '../users/user.entity';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,

    @InjectRepository(UserSubscription)
    private readonly subRepo: Repository<UserSubscription>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ── Plans ──

  async getPlans() {
    return this.planRepo.find({ where: { isActive: true } });
  }

  async createPlan(dto: CreatePlanDto) {
    const plan = this.planRepo.create(dto);
    return this.planRepo.save(plan);
  }

  async updatePlan(id: string, dto: Partial<CreatePlanDto>) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async deletePlan(id: string) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.planRepo.remove(plan);
    return { deleted: true };
  }

  // ── Subscriptions ──

  async subscribe(userId: string, planId: string, autoRenew = true) {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found or inactive');
    }

    const existing = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    if (existing) {
      throw new BadRequestException(
        'You already have an active subscription. Cancel it first before subscribing to a new plan.',
      );
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (Number(user.credits) < Number(plan.price)) {
      throw new BadRequestException(
        `Insufficient credits. You need $${Number(plan.price).toFixed(2)} but have $${Number(user.credits).toFixed(2)}`,
      );
    }

    user.credits = Number(user.credits) - Number(plan.price);
    await this.userRepo.save(user);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const sub = this.subRepo.create({
      userId,
      planId,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      autoRenew,
    });

    await this.subRepo.save(sub);

    return {
      subscription: sub,
      remainingCredits: Number(user.credits),
    };
  }

  async cancel(userId: string) {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    if (!sub) {
      throw new NotFoundException('No active subscription found');
    }

    sub.status = SubscriptionStatus.CANCELLED;
    await this.subRepo.save(sub);
    return { cancelled: true, subscription: sub };
  }

  async getMySubscription(userId: string) {
    return this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
  }

  async checkSubscription(userId: string) {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });

    if (!sub) return { subscribed: false };

    const now = new Date();
    if (now > sub.endDate) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subRepo.save(sub);
      return { subscribed: false };
    }

    return { subscribed: true, subscription: sub };
  }

  async canAccessContent(userId: string): Promise<boolean> {
    const { subscribed } = await this.checkSubscription(userId);
    return subscribed;
  }

  async toggleAutoRenew(userId: string) {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    if (!sub) throw new NotFoundException('No active subscription found');

    sub.autoRenew = !sub.autoRenew;
    await this.subRepo.save(sub);
    return { autoRenew: sub.autoRenew };
  }

  async getPaymentHistory(userId: string) {
    return this.subRepo.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }
}
