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

  /**
   * Assign the Free plan (price = 0) to a newly registered user.
   * Skips credit deduction since the free plan costs nothing.
   * Does nothing if the user already has an active subscription.
   */
  async assignFreePlan(userId: string) {
    const existing = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    if (existing) return existing;

    const freePlan = await this.planRepo.findOne({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
    if (!freePlan || Number(freePlan.price) > 0) return null;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + freePlan.durationDays);

    const sub = this.subRepo.create({
      userId,
      planId: freePlan.id,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      autoRenew: false,
    });

    await this.subRepo.save(sub);
    return sub;
  }

  async subscribe(userId: string, planId: string, autoRenew = true) {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found or inactive');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    if (existing && existing.planId === planId) {
      throw new BadRequestException('You are already subscribed to this plan.');
    }

    // Cancel the old subscription when switching plans
    if (existing) {
      existing.status = SubscriptionStatus.CANCELLED;
      await this.subRepo.save(existing);
    }

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
      previousPlan: existing?.plan?.name ?? null,
      switched: !!existing,
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
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    if (sub && new Date() > new Date(sub.endDate)) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subRepo.save(sub);
      return null;
    }

    return sub;
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

  /**
   * Check if a user can access premium/paid content.
   * Requires an active PAID subscription (plan price > 0).
   * Free-tier subscribers do NOT have access to premium content.
   */
  async canAccessContent(userId: string): Promise<boolean> {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    if (!sub) return false;
    const now = new Date();
    if (now > sub.endDate) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subRepo.save(sub);
      return false;
    }
    return Number(sub.plan?.price ?? 0) > 0;
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
