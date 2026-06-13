import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { SearchController } from './search.controller';
import { Book } from './book.entity';
import { BookMetadata } from './entities/book-metadata.entity';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/entities/genre.entity';
import { Tag } from '../tags/entities/tag.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/user.entity';
import { ReadingProgress } from '../reading-progress/reading-progress.entity';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';
import { GenreModule } from '../genres/genres.module';
import { TagModule } from '../tags/tags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, BookMetadata, Category, Genre, Tag, User, ReadingProgress]),
    NotificationsModule,
    CloudinaryModule,
    GenreModule,
    TagModule,
  ],
  controllers: [BooksController, SearchController],
  providers: [BooksService],
})
export class BooksModule {}
