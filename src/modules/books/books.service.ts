import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Role } from 'src/common/enums/role.enum';
import { Category } from '../categories/category.entity';

const MAX_FREE_BOOKS = 5;

@Injectable()
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private repo: Repository<Book>,

        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
    ) { }

    findAll() {
        return this.repo.find({
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });
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
            ...dto,
            author: { id: user.id },
            categories,
        });

        return this.repo.save(book);
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

        Object.assign(book, dto);
        return this.repo.save(book);
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
}