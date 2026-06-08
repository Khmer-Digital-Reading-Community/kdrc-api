import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from '../challenges/challenge.entity';
import { ReadingProgress } from '../reading-progress/reading-progress.entity';
import { Book } from '../books/book.entity';
import { Review } from '../reviews/review.entity';
import { Genre } from '../genres/entities/genre.entity';
import { Category } from '../categories/category.entity';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Challenge,
      ReadingProgress,
      Book,
      Review,
      Genre,
      Category,
    ]),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
