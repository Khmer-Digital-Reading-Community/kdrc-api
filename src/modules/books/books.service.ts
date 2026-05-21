import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Role } from 'src/common/enums/role.enum';
import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { BookStatus } from 'src/common/enums/book-status.enum';
import { NotificationType } from '../notifications/notification.entity';

const MAX_FREE_BOOKS = 5;

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private repo: Repository<Book>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(User)
    private usersRepo: Repository<User>,

    private notificationsService: NotificationsService,
  ) {}

  findAll() {
    return this.repo.find({
      where: { status: BookStatus.PUBLISHED },
      relations: ['author', 'categories', 'reviews', 'reviews.reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const book = await this.repo.findOne({
      where: { id },
      relations: [
        'author',
        'categories',
        'chapters',
        'reviews',
        'reviews.reviewer',
      ],
    });
    if (book?.chapters?.length) {
      book.chapters.sort((a, b) =>
        a.order !== b.order
          ? a.order - b.order
          : a.chapterNumber - b.chapterNumber,
      );
    }
    return book;
  }

  findAuthorBooks(userId: string) {
    return this.repo.find({
      where: { author: { id: userId } },
      order: { updatedAt: 'DESC' },
    });
  }

  async getAuthorStats(userId: string) {
    const books = await this.repo.find({
      where: { author: { id: userId } },
      relations: ['chapters'],
    });

    const totalBooks = books.length;
    const totalPublished = books.filter(
      (b) => b.status === BookStatus.PUBLISHED,
    ).length;

    let totalWords = 0;
    books.forEach((book) => {
      book.chapters.forEach((chapter) => {
        totalWords += (chapter.content || '')
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0).length;
      });
    });

    return {
      totalBooks,
      totalPublished,
      totalWords,
      // Mocking streak and engagement for now as they require more complex tracking
      streakDays: 14,
      engagementRate: 12.4,
    };
  }

  async create(dto: CreateBookDto, user: any) {
    if (!user?.id) {
      throw new UnauthorizedException();
    }

    let categories: Category[] = [];

    if (dto.categorySlugs?.length) {
      categories = await this.categoryRepo.find({
        where: {
          slug: In(dto.categorySlugs),
        },
      });
    }

    const book = this.repo.create({
      title: dto.title,
      content: dto.content,
      coverImageUrl: dto.coverImageUrl,
      author: { id: user.id },
      categories,
      status: BookStatus.DRAFT,
    });

    const savedBook = await this.repo.save(book);

    // Notify author about book creation
    await this.notificationsService.create({
      title: 'Book Created',
      message: `Your book "${savedBook.title}" has been created successfully!`,
      type: NotificationType.SUCCESS,
      recipientId: user.id,
    });

    return savedBook;
  }

  async update(id: string, dto: UpdateBookDto, user: any) {
    const book = await this.repo.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const isOwner = book.author.id === user.id;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You cannot update this book');
    }

    const oldStatus = book.status;
    Object.assign(book, dto);
    const updatedBook = await this.repo.save(book);

    // If book status changed to PUBLISHED, notify all users
    if (
      oldStatus !== BookStatus.PUBLISHED &&
      updatedBook.status === BookStatus.PUBLISHED
    ) {
      await this.notifyAllUsersAboutBookAvailable(updatedBook);
    }

    return updatedBook;
  }

  async remove(id: string, user: any) {
    const book = await this.repo.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const isOwner = book.author.id === user.id;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You cannot delete this book');
    }

    await this.repo.remove(book);
    return { message: 'Book deleted' };
  }

  private async notifyAllUsersAboutBookAvailable(book: Book) {
    const users = await this.usersRepo.find();

    for (const user of users) {
      try {
        await this.notificationsService.create({
          title: 'Book Available',
          message: `New book "${book.title}" by ${book.author?.name || 'Unknown'} is now available!`,
          type: NotificationType.INFO,
          recipientId: user.id,
        });
      } catch (error) {
        console.error(`Failed to notify user ${user.id}:`, error);
      }
    }
  }
}
