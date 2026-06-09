import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './follow.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const target = await this.userRepo.findOne({ where: { id: followingId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      return existing;
    }

    const follow = this.followRepo.create({ followerId, followingId });
    return this.followRepo.save(follow);
  }

  async unfollow(followerId: string, followingId: string) {
    const follow = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followRepo.remove(follow);
    return { message: 'Unfollowed successfully' };
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    return { isFollowing: !!follow };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.followRepo.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map((f) => ({
        id: f.follower.id,
        name: f.follower.name,
        bio: f.follower.bio,
        avatarUrl: f.follower.avatarUrl,
        followedAt: f.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.followRepo.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map((f) => ({
        id: f.following.id,
        name: f.following.name,
        bio: f.following.bio,
        avatarUrl: f.following.avatarUrl,
        followedAt: f.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCounts(userId: string) {
    const followersCount = await this.followRepo.count({
      where: { followingId: userId },
    });
    const followingCount = await this.followRepo.count({
      where: { followerId: userId },
    });
    return { followersCount, followingCount };
  }
}
