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
import { ReadingProgressModule } from './modules/reading-progress/reading-progress.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { CommunityModule } from './modules/community/community.module';
import { CommentsModule } from './modules/interactions/comments/comments.module';
import { ExchangesModule } from './modules/exchanges/exchanges.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FollowsModule } from './modules/follows/follows.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReadingListsModule } from './modules/reading-lists/reading-lists.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { UploadModule } from './common/upload/upload.module';
import { ChatModule } from './modules/chat/chat.module';

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
    BookmarksModule,
    ReadingProgressModule,
    ChallengesModule,
    AchievementsModule,
    CommunityModule,
    CommentsModule,
    ExchangesModule,
    AdminModule,
    ReportsModule,
    FollowsModule,
    PurchasesModule,
    SubscriptionsModule,
    PaymentsModule,
    ReadingListsModule,
    InteractionsModule,
    UploadModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
