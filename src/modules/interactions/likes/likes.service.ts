import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { ToggleLikeDto, LikeTargetType } from './dto/toggle-like.dto';
import { Book } from 'src/modules/books/book.entity';
import { Chapter } from 'src/modules/chapters/entities/chapter.entity';
import { Comment } from 'src/modules/interactions/comments/entities/comment.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async toggleLike(userId: string, dto: ToggleLikeDto) {
    const { targetType, targetId } = dto;

    // 1. Verify the target actually exists
    await this.verifyTargetExists(targetType, targetId);

    // 2. Check if the user already liked this item
    const whereCondition = this.buildWhereCondition(targetType, targetId, userId);
    const existingLike = await this.likesRepository.findOne({
      where: whereCondition });

    if (existingLike) {
      // If they already liked it, UNLIKE it (remove from DB)
      await this.likesRepository.remove(existingLike);
      await this.updateLikeCount(targetType, targetId, -1);
      return { action: 'unliked', message: 'Like removed successfully' };
    }

    // 3. If they haven't liked it, CREATE the like
    const newLike = this.likesRepository.create({
      userId,
      [this.getTargetField(targetType)]: targetId,
    });

    await this.likesRepository.save(newLike);
    await this.updateLikeCount(targetType, targetId, 1);

    return { action: 'liked', message: 'Like added successfully' };
  }

  async getLikeCount(targetType: LikeTargetType, targetId: string) {
    const count = await this.likesRepository.count({
      where: this.buildWhereCondition(targetType, targetId),
    });
    return { targetType, targetId, count };
  }

  // --- Helper Methods ---
  private buildWhereCondition(
    targetType: LikeTargetType,
    targetId: string,
    userId?: string,
  ) {
    const condition: any = { [this.getTargetField(targetType)]: targetId };
    if (userId) condition.userId = userId;
    return condition;
  }

  private getTargetField(
    targetType: LikeTargetType,
  ): 'bookId' | 'chapterId' | 'commentId' {
    switch (targetType) {
      case LikeTargetType.BOOK:
        return 'bookId';
      case LikeTargetType.CHAPTER:
        return 'chapterId';
      case LikeTargetType.COMMENT:
        return 'commentId';
    }
  }

  private async verifyTargetExists(
    targetType: LikeTargetType,
    targetId: string,
  ) {
    let exists = false;
    if (targetType === LikeTargetType.BOOK) {
      exists = await this.bookRepository.exists({ where: { id: targetId } });
    } else if (targetType === LikeTargetType.CHAPTER) {
      exists = await this.chapterRepository.exists({ where: { id: targetId } });
    } else if (targetType === LikeTargetType.COMMENT) {
      exists = await this.commentRepository.exists({ where: { id: targetId } });
    }

    if (!exists) {
      throw new NotFoundException(
        `${targetType} with ID ${targetId} not found`,
      );
    }
  }

  private async updateLikeCount(
    targetType: LikeTargetType,
    targetId: string,
    change: number,
  ) {
    // This updates the cached 'likeCount' column on the Book entity for fast reading
    if (targetType === LikeTargetType.BOOK) {
      await this.bookRepository.increment(
        { id: targetId },
        'likeCount',
        change,
      );
    }
  }
}
