import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { SearchController } from './search.controller';
import { Book } from './book.entity';
import { Category } from '../categories/category.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Book, Category, User]), NotificationsModule],
    controllers: [BooksController, SearchController],
    providers: [BooksService],
})
export class BooksModule { }