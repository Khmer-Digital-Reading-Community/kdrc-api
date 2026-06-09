import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from 'src/common/enums/role.enum';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Follow } from '../follows/follow.entity';
import { Book } from '../books/book.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,

    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) { }

  findAll() {
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'bio', 'createdAt'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'bio', 'createdAt', 'avatarUrl', 'phoneNumber'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  findByEmailWithPassword(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'password', 'role'],
    });
  }

  findByProviderOrEmail(provider: string, providerId: string, email: string) {
    return this.usersRepository.findOne({
      where: [
        { provider, providerId },
        { email },
      ],
    });
  }

  create(data: Partial<User>) {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  save(user: User) {
    return this.usersRepository.save(user);
  }

  async storeRefreshToken(userId: string, refreshToken: string) {
    await this.usersRepository.update(userId, {
      refreshToken,
    });
  }

  async clearRefreshToken(userId: string) {
    await this.usersRepository.update(userId, {
      refreshToken: null as any,
    });
  }

  findOneWithRefreshToken(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'refreshToken'],
    });
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string; role?: Role; phoneNumber?: string; avatarUrl?: string; email?: string }) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.role !== undefined) user.role = data.role;
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    if (data.email !== undefined) {
      if (data.email !== user.email) {
        const existing = await this.findByEmail(data.email);
        if (existing) {
          throw new BadRequestException('Email already in use');
        }
        user.email = data.email;
      }
    }

    const saved = await this.usersRepository.save(user);
    const { password, refreshToken, ...result } = saved as User & {
      password?: string;
      refreshToken?: string;
    };
    return result;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  // ================= FOR ADMIN ===========================
  async updateRole(userId: string, role: Role) {
    await this.usersRepository.update(userId, { role });
    return { message: 'User role updated' };
  }
  async remove(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.delete(userId);
    return { message: 'User deleted' };
  }

  async getCredits(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'credits'],
    });
    if (!user) throw new NotFoundException('User not found');
    return { credits: Number(user.credits) };
  }

  async addCredits(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.credits = Number(user.credits) + amount;
    await this.usersRepository.save(user);
    return { credits: Number(user.credits) };
  }

  async getAuthorProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'bio', 'avatarUrl', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followersCount = await this.followRepo.count({
      where: { followingId: userId },
    });
    const followingCount = await this.followRepo.count({
      where: { followerId: userId },
    });
    const booksCount = await this.bookRepo.count({
      where: { author: { id: userId }, status: 'PUBLISHED' as any },
    });

    const books = await this.bookRepo.find({
      where: { author: { id: userId }, status: 'PUBLISHED' as any },
      select: ['id', 'title', 'coverImageUrl', 'rating', 'readCount', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      ...user,
      followersCount,
      followingCount,
      booksCount,
      books,
    };
  }
}