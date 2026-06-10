import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';
import { Comment } from '../interactions/comments/entities/comment.entity';
import { Notification } from '../notifications/notification.entity';
import { Challenge } from '../challenges/challenge.entity';
import { Review } from '../reviews/review.entity';
import {
  ContentReport,
  ReportStatus,
} from '../reports/content-report.entity';
import { CommentStatus } from 'src/common/enums/comment-status.enum';
import { Exchange } from '../exchanges/entities/exchange.entity';
import { ExchangeRequest } from '../exchanges/entities/exchange-request.entity';
import {
  ExchangeListingStatus,
  ExchangeRequestStatus,
} from '../../common/enums/exchange.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Book) private readonly booksRepo: Repository<Book>,
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(Challenge)
    private readonly challengesRepo: Repository<Challenge>,
    @InjectRepository(Review) private readonly reviewsRepo: Repository<Review>,
    @InjectRepository(ContentReport)
    private readonly reportsRepo: Repository<ContentReport>,
    @InjectRepository(Exchange)
    private readonly exchangesRepo: Repository<Exchange>,
    @InjectRepository(ExchangeRequest)
    private readonly exchangeRequestsRepo: Repository<ExchangeRequest>,
  ) { }

  async getStats() {
    const [
      totalUsers,
      totalBooks,
      totalComments,
      pendingComments,
      totalChallenges,
      totalReviews,
      totalReports,
      pendingReports,
      totalExchangeListings,
      activeExchangeListings,
      totalExchangeRequests,
      pendingExchangeRequests,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.booksRepo.count(),
      this.commentsRepo.count(),
      this.commentsRepo.count({ where: { status: CommentStatus.PENDING } }),
      this.challengesRepo.count(),
      this.reviewsRepo.count(),
      this.reportsRepo.count(),
      this.reportsRepo.count({ where: { status: ReportStatus.PENDING } }),
      this.exchangesRepo.count(),
      this.exchangesRepo.count({
        where: { listingStatus: ExchangeListingStatus.ACTIVE },
      }),
      this.exchangeRequestsRepo.count(),
      this.exchangeRequestsRepo.count({
        where: { status: ExchangeRequestStatus.PENDING },
      }),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersThisMonth = await this.usersRepo
      .createQueryBuilder('user')
      .where('user.createdAt >= :since', { since: thirtyDaysAgo })
      .getCount();

    const newBooksThisMonth = await this.booksRepo
      .createQueryBuilder('book')
      .where('book.createdAt >= :since', { since: thirtyDaysAgo })
      .getCount();

    const newExchangeListingsThisMonth = await this.exchangesRepo
      .createQueryBuilder('exchange')
      .where('exchange.createdAt >= :since', { since: thirtyDaysAgo })
      .getCount();

    return {
      totalUsers,
      totalBooks,
      totalComments,
      pendingComments,
      totalChallenges,
      totalReviews,
      totalReports,
      pendingReports,
      newUsersThisMonth,
      newBooksThisMonth,
      totalExchangeListings,
      activeExchangeListings,
      totalExchangeRequests,
      pendingExchangeRequests,
      newExchangeListingsThisMonth,
    };
  }

  async getActivity(limit = 10) {
    const [users, books, comments, reports, exchanges, exchangeRequests] =
      await Promise.all([
        this.usersRepo.find({
          select: ['id', 'name', 'email', 'createdAt'],
          order: { createdAt: 'DESC' },
          take: limit,
        }),
        this.booksRepo.find({
          relations: ['author'],
          order: { createdAt: 'DESC' },
          take: limit,
        }),
        this.commentsRepo.find({
          relations: ['user', 'chapter'],
          order: { createdAt: 'DESC' },
          take: limit,
        }),
        this.reportsRepo.find({
          relations: ['reporter', 'reportedUser'],
          order: { createdAt: 'DESC' },
          take: limit,
        }),
        this.exchangesRepo.find({
          relations: ['owner'],
          order: { createdAt: 'DESC' },
          take: limit,
        }),
        this.exchangeRequestsRepo.find({
          relations: ['exchange', 'requester'],
          order: { createdAt: 'DESC' },
          take: limit,
        }),
      ]);
    this.usersRepo.find({
      select: ['id', 'name', 'email', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: limit,
    }),
      this.booksRepo.find({
        relations: ['author'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.commentsRepo.find({
        relations: ['user', 'chapter'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.reportsRepo.find({
        relations: ['reporter', 'reportedUser'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.exchangesRepo.find({
        relations: ['owner'],
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.exchangeRequestsRepo.find({
        relations: ['exchange', 'requester'],
        order: { createdAt: 'DESC' },
        take: limit,
      });

    const items = [
      ...users.map((u) => ({
        id: u.id,
        type: 'user_registered' as const,
        title: 'New user registered',
        subtitle: u.name || u.email,
        timestamp: u.createdAt,
      })),
      ...books.map((b) => ({
        id: b.id,
        type: 'book_added' as const,
        title: 'New book added',
        subtitle: b.title,
        timestamp: b.createdAt,
      })),
      ...comments.map((c) => ({
        id: c.id,
        type: 'comment' as const,
        title: 'New comment',
        subtitle: c.content.slice(0, 60),
        timestamp: c.createdAt,
      })),
      ...reports.map((r) => ({
        id: r.id,
        type: 'report' as const,
        title: 'Content reported',
        subtitle: r.description.slice(0, 60),
        timestamp: r.createdAt,
      })),
      ...exchanges.map((e) => ({
        id: e.id,
        type: 'exchange_listing' as const,
        title: 'New exchange listing',
        subtitle: `${e.title} · ${e.owner?.name || 'Unknown owner'}`,
        timestamp: e.createdAt,
      })),
      ...exchangeRequests.map((r) => ({
        id: r.id,
        type: 'exchange_trade' as const,
        title: 'New trade proposal',
        subtitle: `${r.exchange?.title || 'Listing'} · ${r.requester?.name || 'Unknown user'}`,
        timestamp: r.createdAt,
      })),
    ];

    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return items.slice(0, limit);
  }

  async getAnalytics() {
    const stats = await this.getStats();

    const userGrowth = await this.usersRepo
      .createQueryBuilder('user')
      .select("TO_CHAR(user.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(user.createdAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .limit(12)
      .getRawMany();

    const booksByStatus = await this.booksRepo
      .createQueryBuilder('book')
      .select('book.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('book.status')
      .getRawMany();

    const exchangesByStatus = await this.exchangesRepo
      .createQueryBuilder('exchange')
      .select('exchange.listingStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('exchange.listingStatus')
      .getRawMany();

    const tradesByStatus = await this.exchangeRequestsRepo
      .createQueryBuilder('request')
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.status')
      .getRawMany();

    return {
      stats,
      userGrowth,
      booksByStatus,
      exchangesByStatus,
      tradesByStatus,
    };
  }
}
