import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepo: Repository<Bookmark>,
  ) {}

async addFavorite(userId: string, bookId: string) {
    try {
      const bookmark = this.bookmarkRepo.create({ userId, bookId });
      return await this.bookmarkRepo.save(bookmark);
    } catch (error) {
      // 1. THIS IS OUR DETECTIVE: It will print the real error in your ThinkPad terminal
      console.error('--- DATABASE ERROR DETECTED ---');
      console.error('Code:', error.code);
      console.error('Detail:', error.detail);

      // 2. Duplicate Bookmark (Unique Violation)
      if (error.code === '23505') {
        throw new ConflictException('This book is already in your favorites.');
      }
      
      // 3. Book doesn't exist (Foreign Key Violation)
      if (error.code === '23503') {
        throw new NotFoundException('The book you are trying to bookmark does not exist in the database.');
      }

      throw error;
    }
  }

  async getMyFavorites(userId: string) {
    return await this.bookmarkRepo.find({
      where: { userId },
      relations: ['book'], // This allows the frontend to see book titles/details
      order: { createdAt: 'DESC' },
    });
  }

  async removeFavorite(userId: string, bookId: string) {
    const result = await this.bookmarkRepo.delete({ userId, bookId });
    if (result.affected === 0) {
      throw new NotFoundException('Bookmark not found in your favorites.');
    }
    return { message: 'Successfully removed from favorites.' };
  }
}