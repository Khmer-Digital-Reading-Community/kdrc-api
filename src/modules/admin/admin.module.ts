import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';
import { Comment } from '../interactions/comments/entities/comment.entity';
import { Notification } from '../notifications/notification.entity';
import { Challenge } from '../challenges/challenge.entity';
import { Review } from '../reviews/review.entity';
import { ContentReport } from '../reports/content-report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Book,
      Comment,
      Notification,
      Challenge,
      Review,
      ContentReport,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
