import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';
import { Book } from '../books/book.entity';
import { Purchase } from '../purchases/purchase.entity';
import { UserSubscription } from '../subscriptions/user-subscription.entity';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ChapterContentDto } from './dto/chapter-content.dto';
import { ChapterResponseDto } from './dto/chapter-response.dto';
import { Role } from 'src/common/enums/role.enum';
import { SubscriptionStatus } from 'src/common/enums/subscription-status.enum';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private chaptersRepo: Repository<Chapter>,

    @InjectRepository(Book)
    private booksRepo: Repository<Book>,

    @InjectRepository(Purchase)
    private purchaseRepo: Repository<Purchase>,

    @InjectRepository(UserSubscription)
    private subRepo: Repository<UserSubscription>,
  ) {}

  // ── Access control helpers ──

  private isAuthorOrAdmin(book: Book, user?: any): boolean {
    if (!user) return false;
    return book.author?.id === user.id || user.role === Role.ADMIN;
  }

  private async isSubscribed(userId: string): Promise<boolean> {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    if (!sub) return false;
    if (new Date() > sub.endDate) {
      sub.status = SubscriptionStatus.EXPIRED;
      await this.subRepo.save(sub);
      return false;
    }
    return true;
  }

  private async ownsChapter(userId: string, chapterId: string): Promise<boolean> {
    const purchase = await this.purchaseRepo.findOne({
      where: { userId, chapterId },
    });
    return !!purchase;
  }

  private async ownsBook(userId: string, bookId: string): Promise<boolean> {
    const purchase = await this.purchaseRepo.findOne({
      where: { userId, bookId },
    });
    return !!purchase;
  }

  private getChapterPrice(chapter: Chapter): number {
    return Number(chapter.price ?? 0);
  }

  /**
   * Determine if a chapter is freely readable by anyone.
   * Free = no payment and no subscription required.
   */
  private isChapterFree(chapter: Chapter, book: Book): boolean {
    if (chapter.isPremium) return false;
    if (chapter.isPurchasable && this.getChapterPrice(chapter) > 0) return false;
    return true;
  }

  /**
   * Check access to a single chapter for a given user.
   * Returns { allowed, reason } where reason explains denial.
   */
  private async checkChapterAccess(
    chapter: Chapter,
    book: Book,
    user?: any,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Author/admin can always read their own content
    if (user && this.isAuthorOrAdmin(book, user)) {
      return { allowed: true };
    }

    const userId = user?.id;

    if (chapter.status !== 'PUBLISHED') {
      return { allowed: false, reason: 'This chapter is not published yet' };
    }

    // Premium chapter → requires subscription
    if (chapter.isPremium) {
      if (!userId) return { allowed: false, reason: 'Login required to read premium content' };
      const subscribed = await this.isSubscribed(userId);
      if (!subscribed) return { allowed: false, reason: 'Active subscription required to read premium chapters' };
      return { allowed: true };
    }

    // Purchasable chapter with a price → requires purchase
    if (chapter.isPurchasable && this.getChapterPrice(chapter) > 0) {
      if (!userId) return { allowed: false, reason: 'Login required to purchase this chapter' };
      const owns = await this.ownsChapter(userId, chapter.id) || await this.ownsBook(userId, book.id);
      if (!owns) return { allowed: false, reason: 'Purchase required to read this chapter' };
      return { allowed: true };
    }

    // Book-level premium override
    if (book.isPremium) {
      if (!userId) return { allowed: false, reason: 'Login required to read premium content' };
      const subscribed = await this.isSubscribed(userId);
      if (!subscribed) return { allowed: false, reason: 'Active subscription required' };
      return { allowed: true };
    }

    // Book-level purchase override
    if (book.isPurchasable && Number(book.price ?? 0) > 0 && !book.isFree) {
      if (!userId) return { allowed: false, reason: 'Login required to read this book' };
      const owns = await this.ownsBook(userId, book.id);
      if (!owns) return { allowed: false, reason: 'Purchase required to read this book' };
      return { allowed: true };
    }

    // Free content — no restrictions
    return { allowed: true };
  }

  // ── Service methods ──

  async getChaptersByBookId(
    bookId: string,
    user?: any,
  ): Promise<ChapterResponseDto[]> {
    if (!bookId || typeof bookId !== 'string' || bookId.trim() === '') {
      throw new BadRequestException('Invalid book ID format');
    }

    const book = await this.booksRepo.findOne({
      where: { id: bookId },
      relations: ['author'],
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    const chapters = await this.chaptersRepo.find({
      where: { bookId },
      order: { order: 'ASC', chapterNumber: 'ASC', createdAt: 'ASC' },
    });

    const authorAllowed = this.isAuthorOrAdmin(book, user);

    return chapters
      .filter((ch) => authorAllowed || ch.status === 'PUBLISHED')
      .map((ch) => this.mapToResponseDto(ch));
  }

  async getChapterContent(
    chapterId: string,
    user?: any,
  ): Promise<ChapterContentDto> {
    if (!chapterId || typeof chapterId !== 'string' || chapterId.trim() === '') {
      throw new BadRequestException('Invalid chapter ID format');
    }

    const chapter = await this.chaptersRepo.findOne({
      where: { id: chapterId },
      relations: ['book', 'book.author'],
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
    }

    const { allowed, reason } = await this.checkChapterAccess(
      chapter,
      chapter.book,
      user,
    );

    if (!allowed) {
      throw new ForbiddenException(reason || 'Access denied');
    }

    const wordCount = this.calculateWordCount(chapter.content);
    const readingTimeMinutes = Math.ceil(wordCount / 225);

    return this.mapToContentDto(chapter, wordCount, readingTimeMinutes);
  }

  // ── Author-only mutating methods ──

  async create(dto: CreateChapterDto, user: any): Promise<ChapterResponseDto> {
    const book = await this.booksRepo.findOne({
      where: { id: dto.bookId },
      relations: ['author'],
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${dto.bookId} not found`);
    }

    if (book.author.id !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot add chapters to this book');
    }

    const existingChapter = await this.chaptersRepo.findOne({
      where: { bookId: dto.bookId, chapterNumber: dto.chapterNumber },
    });

    if (existingChapter) {
      throw new BadRequestException(
        `Chapter ${dto.chapterNumber} already exists for this book`,
      );
    }

    const chapter = this.chaptersRepo.create(dto);
    chapter.wordCount = this.calculateWordCount(dto.content || '');
    const savedChapter = await this.chaptersRepo.save(chapter);
    return this.mapToResponseDto(savedChapter);
  }

  async update(id: string, dto: UpdateChapterDto, user: any): Promise<ChapterResponseDto> {
    const chapter = await this.chaptersRepo.findOne({
      where: { id },
      relations: ['book', 'book.author'],
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    if (chapter.book.author.id !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot update this chapter');
    }

    if (dto.chapterNumber && dto.chapterNumber !== chapter.chapterNumber) {
      const existingChapter = await this.chaptersRepo.findOne({
        where: { bookId: chapter.bookId, chapterNumber: dto.chapterNumber },
      });
      if (existingChapter) {
        throw new BadRequestException(
          `Chapter ${dto.chapterNumber} already exists for this book`,
        );
      }
    }

    Object.assign(chapter, dto);
    if (dto.content !== undefined) {
      chapter.wordCount = this.calculateWordCount(dto.content);
    }
    const updatedChapter = await this.chaptersRepo.save(chapter);
    return this.mapToResponseDto(updatedChapter);
  }

  async delete(id: string, user: any): Promise<{ success: boolean; message: string }> {
    const chapter = await this.chaptersRepo.findOne({
      where: { id },
      relations: ['book', 'book.author'],
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    if (chapter.book.author.id !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot delete this chapter');
    }

    await this.chaptersRepo.remove(chapter);
    return { success: true, message: 'Chapter deleted successfully' };
  }

  // ── Mapping helpers ──

  private mapToResponseDto(chapter: Chapter): ChapterResponseDto {
    return {
      id: chapter.id,
      title: chapter.title,
      chapterNumber: chapter.chapterNumber,
      order: chapter.order,
      type: chapter.type,
      status: chapter.status,
      description: chapter.description,
      wordCount: chapter.wordCount,
      price: Number(chapter.price ?? 0),
      isPurchasable: chapter.isPurchasable ?? false,
      isPremium: chapter.isPremium ?? false,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }

  private calculateWordCount(content: string): number {
    if (!content) return 0;
    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plainText.split(' ').filter((word) => word.length > 0).length;
  }

  private mapToContentDto(
    chapter: Chapter,
    wordCount: number,
    readingTimeMinutes: number,
  ): ChapterContentDto {
    return {
      id: chapter.id,
      title: chapter.title,
      content: chapter.content,
      chapterNumber: chapter.chapterNumber,
      order: chapter.order,
      type: chapter.type,
      status: chapter.status,
      description: chapter.description,
      bookId: chapter.bookId,
      price: Number(chapter.price ?? 0),
      isPurchasable: chapter.isPurchasable ?? false,
      isPremium: chapter.isPremium ?? false,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      wordCount: chapter.wordCount,
      readingTimeMinutes,
    };
  }
}
