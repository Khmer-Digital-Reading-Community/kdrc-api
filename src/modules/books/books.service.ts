import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

    findAll() {
        return this.repo.find({
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
    }

    async search(query: string, page: number = 1, limit: number = 12, sort: string = 'recent') {
        if (!query || query.trim() === '') {
            return {
                data: [],
                total: 0,
                page,
                limit,
                pages: 0,
            };
        }

        const skip = (page - 1) * limit;
        const searchTerm = `%${query}%`;

        let query_builder = this.repo
            .createQueryBuilder('book')
            .leftJoinAndSelect('book.author', 'author')
            .leftJoinAndSelect('book.reviews', 'reviews', 'reviews.rating IS NOT NULL')
            .where('book.title ILIKE :searchTerm', { searchTerm })
            .orWhere('book.content ILIKE :searchTerm', { searchTerm })
            .orWhere('author.name ILIKE :searchTerm', { searchTerm });

        // Apply sorting based on sort parameter
        switch (sort) {
            case 'popular':
                // Sort by most recently updated (most active)
                query_builder = query_builder.orderBy('book.updatedAt', 'DESC');
                break;
            case 'trending':
                // Sort by creation date but only recent books (within last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                query_builder = query_builder
                    .andWhere('book.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
                    .orderBy('book.createdAt', 'DESC');
                break;
            case 'rating':
                // Sort by average rating from reviews
                query_builder = query_builder
                    .addSelect('AVG(reviews.rating)', 'avgRating')
                    .groupBy('book.id')
                    .addGroupBy('author.id')
                    .orderBy('avgRating', 'DESC');
                break;
            case 'recent':
            default:
                // Default: sort by creation date (most recent first)
                query_builder = query_builder.orderBy('book.createdAt', 'DESC');
                break;
        }

        const [data, total] = await query_builder
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
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