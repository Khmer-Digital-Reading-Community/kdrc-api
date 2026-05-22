import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { QueryBooksDto } from './dto/query-books.dto';

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
    ) { }

    async findAll(queryDto: QueryBooksDto) {
        const {
            page = '1',
            limit = '10',
            search,
            genre,
            author,
            minRating,
            sort,
            order,
        } = queryDto;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        const skip = (pageNumber - 1) * limitNumber;

        const query = this.repo
            .createQueryBuilder('book')
            .leftJoinAndSelect(
                'book.author',
                'author',
            )
            .leftJoinAndSelect(
                'book.categories',
                'category',
            )
            .skip(skip)
            .take(limitNumber);

        if (search?.trim()) {
            query.andWhere(
                `
                to_tsvector(
                    'english',
                    coalesce(book.title, '') || ' ' ||
                    coalesce(book.content, '') || ' ' ||
                    coalesce(author.name, '')
                )
                @@ plainto_tsquery('english', :search)
                `,
                { search },
            );
        }

        if (genre?.trim()) {
            const genres = genre
                .split(',')
                .map((g) => g.trim().toLowerCase())
                .filter(Boolean);

            if (genres.length > 0) {
                query.andWhere(
                    'LOWER(category.slug) IN (:...genres)',
                    { genres },
                );
            }
        }

        if (author?.trim()) {
            query.andWhere(
                'LOWER(author.name) LIKE LOWER(:author)',
                {
                    author: `%${author}%`,
                },
            );
        }

        if (minRating) {
            query.andWhere(
                'book.rating >= :minRating',
                {
                    minRating: Number(minRating),
                },
            );
        }

        const allowedSorts = [
            'popular',
            'rating',
            'latest',
            'oldest',
            'likes',
            'reads',
            'updated',
        ];

        if (sort && !allowedSorts.includes(sort)) {
            throw new BadRequestException(
                `Invalid sort value: ${sort}`,
            );
        }

        const allowedOrders = ['asc', 'desc'];

        if (
            order &&
            !allowedOrders.includes(order.toLowerCase())
        ) {
            throw new BadRequestException(
                `Invalid order value: ${order}`,
            );
        }

        const sortOrder =
            order?.toUpperCase() === 'ASC'
                ? 'ASC'
                : 'DESC';

        switch (sort) {
            case 'popular':
                query
                    .addSelect(
                        'book.readCount + (book.likeCount * 3)',
                        'popularityscore',
                    )
                    .orderBy(
                        'popularityscore',
                        sortOrder,
                    );
                break;

            case 'rating':
                query.orderBy(
                    'book.rating',
                    sortOrder,
                );
                break;

            case 'latest':
                query.orderBy(
                    'book.createdAt',
                    sortOrder,
                );
                break;

            case 'oldest':
                query.orderBy(
                    'book.createdAt',
                    sortOrder,
                );
                break;

            case 'likes':
                query.orderBy(
                    'book.likeCount',
                    sortOrder,
                );
                break;

            case 'reads':
                query.orderBy(
                    'book.readCount',
                    sortOrder,
                );
                break;

            case 'updated':
                query.orderBy(
                    'book.updatedAt',
                    sortOrder,
                );
                break;

            default:
                query.orderBy(
                    'book.createdAt',
                    'DESC',
                );
        }

        const [data, total] =
            await query.getManyAndCount();

        return {
            data,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(
                total / limitNumber,
            ),
        };
    }

    async findOne(id: string) {
        const book = await this.repo.findOne({
            where: { id },
            relations: ['author', 'categories'],
        });

        if (!book) {
            throw new NotFoundException(
                'Book not found',
            );
        }

        book.readCount = (book.readCount || 0) + 1;

        await this.repo.save(book);

        return book;
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
        if (oldStatus !== BookStatus.PUBLISHED && updatedBook.status === BookStatus.PUBLISHED) {
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

    async search(q: string, page = 1, limit = 10) {
        if (!q || !q.trim()) {
            return [];
        }

        const skip = (page - 1) * limit;

        const query = this.repo
            .createQueryBuilder('book')
            .leftJoinAndSelect('book.author', 'author')
            .addSelect(`
                ts_rank(
                    to_tsvector(
                    'english',
                    coalesce(book.title, '') || ' ' ||
                    coalesce(book.content, '') || ' ' ||
                    coalesce(author.name, '')
                    ),
                    plainto_tsquery('english', :query)
                )
                `, 'rank')
            .where(`
                to_tsvector(
                    'english',
                    coalesce(book.title, '') || ' ' ||
                    coalesce(book.content, '') || ' ' ||
                    coalesce(author.name, '')
                )
                @@ plainto_tsquery('english', :query)
                `, {
                query: q,
            })
            .orderBy('rank', 'DESC')
            .skip(skip)
            .take(limit);

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
        };
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