import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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
      select: ['id', 'email', 'name', 'role', 'bio', 'createdAt'],
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

  async updateProfile(userId: string, data: { name?: string; bio?: string; role?: Role }) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.role !== undefined) user.role = data.role;

    const saved = await this.usersRepository.save(user);
    const { password, refreshToken, ...result } = saved as User & {
      password?: string;
      refreshToken?: string;
    };
    return result;
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
}