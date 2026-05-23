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
import { Genre } from '../genres/entities/genre.entity';
import { Tag } from '../tags/entities/tag.entity';
import { BookMetadata } from './entities/book-metadata.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { BookStatus } from 'src/common/enums/book-status.enum';
import { NotificationType } from '../notifications/notification.entity';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { GenreService } from '../genres/genres.service';
import { TagService } from '../tags/tags.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private repo: Repository<Book>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(Genre)
    private genreRepo: Repository<Genre>,

    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,

    @InjectRepository(BookMetadata)
    private metadataRepo: Repository<BookMetadata>,

    @InjectRepository(User)
    private usersRepo: Repository<User>,

    private notificationsService: NotificationsService,
    private cloudinaryService: CloudinaryService,
    private genreService: GenreService,
    private tagService: TagService,
  ) {}

  findAll() {
    return this.repo.find({
      where: { status: BookStatus.PUBLISHED },
      relations: ['author', 'categories', 'genre', 'tags', 'metadata', 'reviews', 'reviews.reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const book = await this.repo.findOne({
      where: { id },
      relations: [
        'author',
        'categories',
        'genre',
        'tags',
        'metadata',
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
      relations: ['genre', 'categories', 'tags', 'metadata'],
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
      streakDays: 14,
      engagementRate: 12.4,
    };
  }

  async create(dto: CreateBookDto, user: any) {
    if (!user?.id) {
      throw new UnauthorizedException();
    }

    const categories = dto.categorySlugs?.length
      ? await this.categoryRepo.find({
          where: { slug: In(dto.categorySlugs) },
        })
      : [];

    let genre: Genre | undefined;
    if (dto.genreSlug) {
      genre = await this.genreService.getOrCreate(dto.genreSlug);
    }

    const tags = dto.tagSlugs?.length
      ? await Promise.all(
          dto.tagSlugs.map((slug) =>
            this.tagService.getOrCreateBySlug(slug),
          ),
        )
      : [];

    const book = this.repo.create({
      title: dto.title,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      author: { id: user.id },
      categories,
      genre,
      tags,
      status: BookStatus.DRAFT,
    });

    const savedBook = await this.repo.save(book);

    // Create metadata if provided
    if (dto.metadata) {
      const metadata = this.metadataRepo.create({
        ...dto.metadata,
        bookId: savedBook.id,
        book: savedBook,
      });
      await this.metadataRepo.save(metadata);
      savedBook.metadata = metadata;
    }

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

    if (dto.coverImageUrl && book.coverImageUrl && dto.coverImageUrl !== book.coverImageUrl) {
      this.deleteOldCover(book.coverImageUrl).catch((err) => {
        console.error('Failed to delete old cover:', err);
      });
    }

    // Handle relationships
    if (dto.categorySlugs) {
      const categories = await this.categoryRepo.find({
        where: { slug: In(dto.categorySlugs) },
      });
      book.categories = categories;
    }

    if (dto.genreSlug) {
      book.genre = await this.genreService.getOrCreate(dto.genreSlug);
    }

    if (dto.tagSlugs) {
      book.tags = await Promise.all(
        dto.tagSlugs.map((slug) => this.tagService.getOrCreateBySlug(slug)),
      );
    }

    const oldStatus = book.status;
    Object.assign(book, dto);
    const updatedBook = await this.repo.save(book);

    // Update metadata if provided
    if (dto.metadata) {
      let metadata = await this.metadataRepo.findOne({
        where: { bookId: id },
      });
      if (!metadata) {
        metadata = this.metadataRepo.create({
          ...dto.metadata,
          bookId: id,
        });
      } else {
        Object.assign(metadata, dto.metadata);
      }
      await this.metadataRepo.save(metadata);
    }

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

    if (book.coverImageUrl) {
      this.deleteOldCover(book.coverImageUrl).catch((err) => {
        console.error('Failed to delete cover:', err);
      });
    }

    await this.repo.remove(book);
    return { message: 'Book deleted' };
  }

  private async deleteOldCover(imageUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(imageUrl);
      if (publicId) {
        await this.cloudinaryService.deleteFile(publicId);
      }
    } catch (error) {
      console.error('Error deleting cover from Cloudinary:', error);
    }
  }

  private extractPublicId(imageUrl: string): string | null {
    try {
      const match = imageUrl.match(/\/toscan\/book-covers\/([^/]+)$/);
      return match ? `toscan/book-covers/${match[1]}` : null;
    } catch {
      return null;
    }
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
