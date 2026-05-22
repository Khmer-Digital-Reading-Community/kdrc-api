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

    async findAll(
        page: number,
        limit: number,
        search?: string,
        genre?: string,
        author?: string,
        minRating?: number,
    ) {
        const skip = (page - 1) * limit;

        const query = this.repo
            .createQueryBuilder('book')
            .leftJoinAndSelect('book.author', 'author')
            .leftJoinAndSelect('book.categories', 'category')
            .orderBy('book.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (search) {
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

        if (genre) {
            const genres = genre
                .split(',')
                .map((g) => g.trim().toLowerCase());

            const validGenres = await this.categoryRepo.find();

            const validSlugs = validGenres.map(
                (g) => g.slug.toLowerCase(),
            );

            for (const g of genres) {
                if (!validSlugs.includes(g)) {
                    throw new BadRequestException(
                        `Invalid genre: ${g}`,
                    );
                }
            }

            query.andWhere(
                'LOWER(category.slug) IN (:...genres)',
                { genres },
            );
        }

        if (author) {
            const existingAuthor = await this.usersRepo
                .createQueryBuilder('user')
                .where(
                    'LOWER(user.name) LIKE LOWER(:author)',
                    {
                        author: `%${author}%`,
                    },
                )
                .getOne();

            if (!existingAuthor) {
                throw new BadRequestException(
                    `Author not found: ${author}`,
                );
            }
            query.andWhere(
                'LOWER(author.name) LIKE LOWER(:author)',
                {
                    author: `%${author}%`,
                },
            );
        }

        if (minRating !== undefined) {

            if (
                minRating !== undefined &&
                (minRating < 0 || minRating > 5)
            ) {
                throw new BadRequestException(
                    'Rating must be between 0 and 5',
                );
            }
            query.andWhere(
                'book.rating >= :minRating',
                { minRating },
            );
        }

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    findOne(id: string) {
        return this.repo.findOne({
            where: { id },
            relations: ['author'],
        });
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