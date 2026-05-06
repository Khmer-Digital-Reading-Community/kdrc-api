import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Used for Private Profile (/me)
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  
  async getPublicProfile(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      // select only public fields
      select: ['id', 'name', 'bio', 'avatarUrl'], 
    });

    if (!user) throw new NotFoundException('User not found');

    return { 
      ...user, 
      followerCount: 0, 
      publishedBooks: [] 
    };
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }
}