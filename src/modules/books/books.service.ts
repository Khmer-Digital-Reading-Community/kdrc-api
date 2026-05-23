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

// const MAX_FREE_BOOKS = 5;

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
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const book = await this.repo.findOne({
      where: { id },
      relations: ['author', 'categories'],
    });
    // Handle missing book
    if (!book) throw new NotFoundException('Book not found');
    // Return the data
    return {
      id: book.id,
      title: book.title,
      authorName: book.author ? book.author.name || 'Unknown' : 'Unknown',
      description: book.content ? book.content.substring(0, 100) + '...' : '', // Return a short description
      coverImageUrl: book.coverImageUrl,
      genres: book.categories, // Map 'categories' to 'genres'
      author: book.author
        ? {
            id: book.author.id,
            name: book.author.name,
          }
        : null,
      status: book.status,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    };
  }

  async create(dto: CreateBookDto, user: User) {
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

  async update(id: string, dto: UpdateBookDto, user: User) {
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

  async remove(id: string, user: User) {
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
