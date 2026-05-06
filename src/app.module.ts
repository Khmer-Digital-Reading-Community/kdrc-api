import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './common/config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BooksModule } from './modules/books/books.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { Bookmark } from './modules/bookmarks/bookmark.entity';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // TypeOrmModule.forRoot(databaseConfig),
    // TypeOrmModule.forFeature([Bookmark]),
    TypeOrmModule.forRoot({
      ...databaseConfig, 
      entities: [...(databaseConfig.entities as any[]), Bookmark], 
    }),

    AuthModule,
    UsersModule,
    BooksModule,
    CategoriesModule,
    BookmarksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule { }
