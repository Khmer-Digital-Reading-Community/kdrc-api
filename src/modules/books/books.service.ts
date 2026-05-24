import {
  BadRequestException,
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
import { QueryBooksDto } from './dto/query-books.dto';
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

  async findAll(queryDto: QueryBooksDto) {
    const pageNumber = Number(queryDto.page ?? '1');
    const limitNumber = Number(queryDto.limit ?? '10');
    const skip = (pageNumber - 1) * limitNumber;

    const query = this.createBaseBookQuery().skip(skip).take(limitNumber);

    this.applySearchFilter(query, queryDto.search);
    this.applyFacetFilters(query, queryDto);
    this.applyOrdering(
      query,
      queryDto.sort,
      queryDto.order,
      !!queryDto.search?.trim(),
    );

    const [data, total] = await query.getManyAndCount();

    return this.paginate(data, total, pageNumber, limitNumber);
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

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.chapters?.length) {
      book.chapters.sort((a, b) =>
        a.order !== b.order
          ? a.order - b.order
          : a.chapterNumber - b.chapterNumber,
      );
    }

    await this.repo.increment({ id }, 'readCount', 1);
    book.readCount = (book.readCount || 0) + 1;

    return book;
  }

  async findOneBasic(id: string) {
    const book = await this.repo.findOne({
      where: { id },
      select: ['id', 'title', 'coverImageUrl', 'status', 'description'],
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async findAuthorBooks(userId: string) {
    const books = await this.repo.find({
      where: { author: { id: userId } },
      relations: ['genre', 'categories', 'tags', 'metadata', 'chapters'],
      order: { updatedAt: 'DESC' },
    });

    books.forEach((book) => {
      if (book.chapters) {
        book.chapters.forEach((chapter) => {
          if (!chapter.wordCount && chapter.content) {
            const plainText = (chapter.content || '')
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            chapter.wordCount = plainText
              .split(' ')
              .filter((w) => w.length > 0).length;
          }
        });
      }
    });

    return books;
  }

  async getAuthorStats(userId: string) {
    const books = await this.repo.find({
      where: { author: { id: userId } },
      relations: ['chapters'],
    });

    const totalBooks = books.length;
    const totalPublished = books.filter(
      (book) => book.status === BookStatus.PUBLISHED,
    ).length;

    let totalWords = 0;
    books.forEach((book) => {
      book.chapters?.forEach((chapter) => {
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

  async search(q: string, page = 1, limit = 10, sort?: string) {
    if (!q || !q.trim()) {
      return this.paginate([], 0, page, limit);
    }

    const query = this.createBaseBookQuery()
      .andWhere(
        `
        to_tsvector(
          'english',
          coalesce(book.title, '') || ' ' ||
          coalesce(book.description, '') || ' ' ||
          coalesce(author.name, '') || ' ' ||
          coalesce(genre.name, '') || ' ' ||
          coalesce(category.name, '')
        ) @@ plainto_tsquery('english', :search)
        `,
        { search: q.trim() },
      )
      .addSelect(
        `ts_rank(
          to_tsvector(
            'english',
            coalesce(book.title, '') || ' ' ||
            coalesce(book.description, '') || ' ' ||
            coalesce(author.name, '') || ' ' ||
            coalesce(genre.name, '') || ' ' ||
            coalesce(category.name, '')
          ),
          plainto_tsquery('english', :search)
        )`,
        'rank',
      )
      .skip((page - 1) * limit)
      .take(limit);

    this.applyOrdering(query, sort, undefined, true);

    const [data, total] = await query.getManyAndCount();

    return this.paginate(data, total, page, limit);
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
          dto.tagSlugs.map((slug) => this.tagService.getOrCreateBySlug(slug)),
        )
      : [];

    const book = this.repo.create({
      title: dto.title,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      tableOfContents: dto.tableOfContents,
      author: { id: user.id },
      categories,
      genre,
      tags,
      status: BookStatus.DRAFT,
    });

    const savedBook = await this.repo.save(book);

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

    if (
      dto.coverImageUrl &&
      book.coverImageUrl &&
      dto.coverImageUrl !== book.coverImageUrl
    ) {
      this.deleteOldCover(book.coverImageUrl).catch((err) => {
        console.error('Failed to delete old cover:', err);
      });
    }

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

  private createBaseBookQuery() {
    return this.repo
      .createQueryBuilder('book')
      .distinct(true)
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.genre', 'genre')
      .leftJoinAndSelect('book.categories', 'category')
      .leftJoinAndSelect('book.tags', 'tag')
      .leftJoinAndSelect('book.metadata', 'metadata')
      .leftJoinAndSelect('book.reviews', 'reviews')
      .leftJoinAndSelect('reviews.reviewer', 'reviewer')
      .where('book.status = :status', {
        status: BookStatus.PUBLISHED,
      });
  }

  private applySearchFilter(query: any, search?: string) {
    if (!search?.trim()) {
      return;
    }

    query.andWhere(
      `
      to_tsvector(
        'english',
        coalesce(book.title, '') || ' ' ||
        coalesce(book.description, '') || ' ' ||
        coalesce(author.name, '') || ' ' ||
        coalesce(genre.name, '') || ' ' ||
        coalesce(category.name, '')
      ) @@ plainto_tsquery('english', :search)
      `,
      { search: search.trim() },
    );
  }

  private applyFacetFilters(query: any, queryDto: QueryBooksDto) {
    const categoryValues = this.parseList(queryDto.category);
    const genreValues = this.parseList(queryDto.genres ?? queryDto.genre);

    if (categoryValues.length > 0) {
      query.andWhere(
        '(LOWER(category.slug) IN (:...categoryValues) OR LOWER(category.name) IN (:...categoryValues))',
        { categoryValues },
      );
    }

    if (genreValues.length > 0) {
      query.andWhere(
        '(LOWER(genre.slug) IN (:...genreValues) OR LOWER(genre.name) IN (:...genreValues))',
        { genreValues },
      );
    }

    if (queryDto.authors?.trim()) {
      const authors = this.parseList(queryDto.authors);
      if (authors.length > 0) {
        query.andWhere('LOWER(author.name) IN (:...authors)', { authors });
      }
    } else if (queryDto.author?.trim()) {
      query.andWhere('LOWER(author.name) LIKE LOWER(:author)', {
        author: `%${queryDto.author.trim()}%`,
      });
    }

    if (queryDto.language?.trim()) {
      query.andWhere('LOWER(metadata.language) = LOWER(:language)', {
        language: queryDto.language.trim(),
      });
    }

    if (queryDto.minRating) {
      query.andWhere('book.rating >= :minRating', {
        minRating: Number(queryDto.minRating),
      });
    }
  }

  private applyOrdering(
    query: any,
    sort?: string,
    order?: string,
    hasSearch = false,
  ) {
    const normalizedSort = this.normalizeSort(sort);
    const sortOrder = order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    switch (normalizedSort) {
      case 'popular':
        query
          .addSelect('book.readCount + (book.likeCount * 3)', 'popularityScore')
          .orderBy('popularityScore', sortOrder);
        break;
      case 'trending':
        query
          .addSelect('book.readCount + (book.likeCount * 2)', 'trendingScore')
          .orderBy('trendingScore', sortOrder);
        break;
      case 'rating':
        query.orderBy('book.rating', sortOrder);
        break;
      case 'latest':
        query.orderBy('book.createdAt', sortOrder);
        break;
      case 'oldest':
        query.orderBy('book.createdAt', sortOrder);
        break;
      case 'likes':
        query.orderBy('book.likeCount', sortOrder);
        break;
      case 'reads':
        query.orderBy('book.readCount', sortOrder);
        break;
      case 'updated':
        query.orderBy('book.updatedAt', sortOrder);
        break;
      default:
        if (hasSearch) {
          query.orderBy('rank', 'DESC').addOrderBy('book.createdAt', 'DESC');
        } else {
          query.orderBy('book.createdAt', 'DESC');
        }
        break;
    }
  }

  private normalizeSort(sort?: string) {
    if (!sort) {
      return undefined;
    }

    if (sort === 'recent') {
      return 'latest';
    }

    return sort;
  }

  private parseList(value?: string) {
    return (value ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  private paginate<T>(data: T[], total: number, page: number, limit: number) {
    const pages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      pages,
      totalPages: pages,
    };
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

  /**
   * Get search suggestions for autocomplete
   * @param query - Search query string
   * @param limit - Maximum number of suggestions per category (default: 10)
   * @returns Object with books and authors suggestions
   */
  async getSearchSuggestions(query: string, limit: number = 10) {
    if (!query || query.trim() === '') {
      return {
        books: [],
        authors: [],
        categories: [],
      };
    }

    const searchTerm = `%${query}%`;

    // Get unique authors from books matching the query
    const authorQuery = this.repo
      .createQueryBuilder('book')
      .select('DISTINCT author.id', 'id')
      .addSelect('author.name', 'name')
      .leftJoin('book.author', 'author')
      .where('book.title ILIKE :searchTerm', { searchTerm })
      .orWhere('book.content ILIKE :searchTerm', { searchTerm })
      .orWhere('author.name ILIKE :searchTerm', { searchTerm })
      .limit(limit);

    // Get books matching the query
    const books = await this.repo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .where('book.title ILIKE :searchTerm', { searchTerm })
      .orWhere('book.content ILIKE :searchTerm', { searchTerm })
      .orWhere('author.name ILIKE :searchTerm', { searchTerm })
      .orderBy('book.title', 'ASC')
      .limit(limit)
      .getMany();

    // Get unique authors
    const authors = await authorQuery.getRawMany();

    // Get categories matching the query
    const categories = await this.categoryRepo
      .createQueryBuilder('category')
      .where('category.name ILIKE :searchTerm', { searchTerm })
      .orWhere('category.slug ILIKE :searchTerm', { searchTerm })
      .limit(limit)
      .getMany();

    return {
      books: books.map((b) => ({
        id: b.id,
        title: b.title,
        coverImage: (b as any).coverImageUrl || null,
        author: b.author
          ? {
              id: b.author.id,
              name: b.author.name,
            }
          : null,
      })),
      authors: authors.map((a: any) => ({
        id: a.id,
        name: a.name,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    };
  }
}
