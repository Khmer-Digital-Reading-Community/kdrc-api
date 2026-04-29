import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
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
      select: ['id', 'email', 'password', 'role'],
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
      select: ['id', 'email', 'role', 'refreshToken'],
    });
  }
}
