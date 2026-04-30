import { DataSourceOptions } from 'typeorm';
import { User } from '../../users/user.entity';
import { Book } from '../../books/book.entity';
import { Chapter } from '../../chapters/chapter.entity';
import { Review } from '../../reviews/review.entity';
import { Comment } from '../../comments/comment.entity';
import { ReadingProgress } from '../../reading-progress/reading-progress.entity';
import { Bookmark } from '../../bookmarks/bookmark.entity';
import { Genre } from '../../genres/genre.entity';
import { PhysicalExchange } from '../../physical-exchanges/physical-exchange.entity';
import { Subscription } from '../../subscriptions/subscription.entity';

const toBool = (value: string | undefined, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'postgres',
  entities: [
    User,
    Book,
    Chapter,
    Review,
    Comment,
    ReadingProgress,
    Bookmark,
    Genre,
    PhysicalExchange,
    Subscription,
  ],
  synchronize: toBool(process.env.TYPEORM_SYNC, true),
  migrations: ['dist/migrations/*.js'],
  migrationsRun: toBool(process.env.TYPEORM_MIGRATIONS_RUN, false),
};