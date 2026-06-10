import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminExchangeService } from './admin-exchange.service';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';
import { Comment } from '../interactions/comments/entities/comment.entity';
import { Notification } from '../notifications/notification.entity';
import { Challenge } from '../challenges/challenge.entity';
import { Review } from '../reviews/review.entity';
import { ContentReport } from '../reports/content-report.entity';
import { Exchange } from '../exchanges/entities/exchange.entity';
import { ExchangeRequest } from '../exchanges/entities/exchange-request.entity';

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
      Exchange,
      ExchangeRequest,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminExchangeService],
})
export class AdminModule { }
