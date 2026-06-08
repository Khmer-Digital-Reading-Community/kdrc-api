import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './purchase.entity';
import { Book } from '../books/book.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { User } from '../users/user.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,

    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,

    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async buyBook(userId: string, bookId: string) {
    const book = await this.bookRepo.findOne({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');

    if (!book.isPurchasable || book.price <= 0) {
      throw new BadRequestException('This book is not available for purchase');
    }

    const existing = await this.purchaseRepo.findOne({
      where: { userId, bookId },
    });
    if (existing) {
      throw new BadRequestException('You already own this book');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (Number(user.credits) < Number(book.price)) {
      throw new BadRequestException(
        `Insufficient credits. You have $${Number(user.credits).toFixed(2)} but this book costs $${Number(book.price).toFixed(2)}`,
      );
    }

    user.credits = Number(user.credits) - Number(book.price);
    await this.userRepo.save(user);

    const purchase = this.purchaseRepo.create({
      userId,
      bookId,
      amount: book.price,
    });
    await this.purchaseRepo.save(purchase);

    return {
      purchase,
      remainingCredits: Number(user.credits),
    };
  }

  async buyChapter(userId: string, chapterId: string) {
    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId },
      relations: ['book'],
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    if (!chapter.isPurchasable || chapter.price <= 0) {
      throw new BadRequestException(
        'This chapter is not available for purchase',
      );
    }

    const existing = await this.purchaseRepo.findOne({
      where: { userId, chapterId },
    });
    if (existing) {
      throw new BadRequestException('You already own this chapter');
    }

    const ownsBook = await this.purchaseRepo.findOne({
      where: { userId, bookId: chapter.bookId },
    });
    if (ownsBook) {
      throw new BadRequestException(
        'You already own the full book that contains this chapter',
      );
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (Number(user.credits) < Number(chapter.price)) {
      throw new BadRequestException(
        `Insufficient credits. You have $${Number(user.credits).toFixed(2)} but this chapter costs $${Number(chapter.price).toFixed(2)}`,
      );
    }

    user.credits = Number(user.credits) - Number(chapter.price);
    await this.userRepo.save(user);

    const purchase = this.purchaseRepo.create({
      userId,
      chapterId,
      bookId: chapter.bookId,
      amount: chapter.price,
    });
    await this.purchaseRepo.save(purchase);

    return {
      purchase,
      remainingCredits: Number(user.credits),
    };
  }

  async checkBookOwnership(userId: string, bookId: string) {
    const purchase = await this.purchaseRepo.findOne({
      where: { userId, bookId },
    });
    return { owned: !!purchase };
  }

  async checkChapterOwnership(userId: string, chapterId: string) {
    const chapter = await this.chapterRepo.findOne({
      where: { id: chapterId },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    const chapterPurchase = await this.purchaseRepo.findOne({
      where: { userId, chapterId },
    });
    if (chapterPurchase) return { owned: true, source: 'chapter' };

    const bookPurchase = await this.purchaseRepo.findOne({
      where: { userId, bookId: chapter.bookId },
    });
    if (bookPurchase) return { owned: true, source: 'book' };

    return { owned: false };
  }

  async getUserPurchases(userId: string) {
    return this.purchaseRepo.find({
      where: { userId },
      relations: ['book', 'chapter'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserLibrary(userId: string) {
    const purchases = await this.purchaseRepo.find({
      where: { userId },
      relations: ['book', 'book.author', 'chapter', 'chapter.book'],
      order: { createdAt: 'DESC' },
    });

    const booksMap = new Map<string, any>();
    const standaloneChapters: any[] = [];

    for (const p of purchases) {
      if (p.book && !booksMap.has(p.book.id)) {
        booksMap.set(p.book.id, {
          id: p.book.id,
          title: p.book.title,
          coverImageUrl: p.book.coverImageUrl,
          rating: p.book.rating,
          readCount: p.book.readCount,
          author: p.book.author
            ? { id: p.book.author.id, name: p.book.author.name }
            : null,
          purchasedAt: p.createdAt,
          amount: p.amount,
          type: 'book',
        });
      }

      if (p.chapter && !p.book) {
        standaloneChapters.push({
          id: p.chapter.id,
          title: p.chapter.title,
          chapterNumber: p.chapter.chapterNumber,
          bookTitle: p.chapter.book?.title,
          bookId: p.chapter.bookId,
          purchasedAt: p.createdAt,
          amount: p.amount,
          type: 'chapter',
        });
      }
    }

    return {
      books: Array.from(booksMap.values()),
      chapters: standaloneChapters,
    };
  }
}
