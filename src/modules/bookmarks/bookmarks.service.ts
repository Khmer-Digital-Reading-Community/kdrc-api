import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark, BookmarkType } from './bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepo: Repository<Bookmark>,
  ) {}

  async addBookmark(userId: string, type: BookmarkType, targetId: string) {
    // 1. Validate inputs based on incoming structural type
    const saveData: Partial<Bookmark> = { userId, type };

    if (type === BookmarkType.BOOK) {
      saveData.bookId = targetId;
      saveData.chapterId = undefined; // Force explicit empty state
    } else if (type === BookmarkType.CHAPTER) {
      saveData.chapterId = targetId;
      saveData.bookId = undefined;
    } else {
      throw new BadRequestException('Invalid bookmark type. Must be BOOK or CHAPTER.');
    }

    try {
      // 2. Fire save execution straight to PostgreSQL
      const bookmark = this.bookmarkRepo.create(saveData);
      return await this.bookmarkRepo.save(bookmark);
    } catch (error: any) {
      // 3. PostgreSQL unique violation error handler (Code: 23505)
      if (error.code === '23505') {
        throw new ConflictException(`This ${type.toLowerCase()} is already bookmarked.`);
      }
      // Foreign key violation if target object doesn't exist (Code: 23503)
      if (error.code === '23503') {
        throw new NotFoundException(`The target ${type.toLowerCase()} item does not exist.`);
      }
      throw error;
    }
  }

  async getMyBookmarks(userId: string) {
    return await this.bookmarkRepo.find({
      where: { userId },
      relations: ['book', 'chapter'], // Automatically hooks up loaded entity relations
      order: { createdAt: 'DESC' },
    });
  }

  async removeBookmark(userId: string, type: BookmarkType, targetId: string) {
    const lookupCriteria: Record<string, any> = { userId, type };

    if (type === BookmarkType.BOOK) {
      lookupCriteria.bookId = targetId;
    } else {
      lookupCriteria.chapterId = targetId;
    }

    // Direct database wipe command (Highly performant block query!)
    const result = await this.bookmarkRepo.delete(lookupCriteria);
    
    if (result.affected === 0) {
      throw new NotFoundException('Bookmark not found in your collection.');
    }

    return { message: `Successfully removed ${type.toLowerCase()} from bookmarks.` };
  }
}