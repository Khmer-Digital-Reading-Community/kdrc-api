import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book } from './book.entity';
import { Category } from '../categories/category.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Book, Category])],
    controllers: [BooksController],
    providers: [BooksService],
})
export class BooksModule { }