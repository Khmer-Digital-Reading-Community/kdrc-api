import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { Chapter } from './entities/chapter.entity';
import { Book } from '../books/book.entity';
import { Purchase } from '../purchases/purchase.entity';
import { UserSubscription } from '../subscriptions/user-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Book, Purchase, UserSubscription])],
  controllers: [ChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
