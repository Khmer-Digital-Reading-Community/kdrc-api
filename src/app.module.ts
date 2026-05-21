import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './common/config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BooksModule } from './modules/books/books.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { Bookmark } from './modules/bookmarks/bookmark.entity';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 600, // Default TTL in seconds (10 minutes)
      max: 100, // Maximum number of cached items
    }),
    TypeOrmModule.forRoot(databaseConfig),

    AuthModule,
    UsersModule,
    BooksModule,
    CategoriesModule,
    NotificationsModule,
    ChaptersModule,
    ReviewsModule,
    ChaptersModule,
    BookmarksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
