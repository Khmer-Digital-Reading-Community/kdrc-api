import { DataSourceOptions } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { Book } from 'src/modules/books/book.entity';
import { Category } from 'src/modules/categories/category.entity';
import { Notification } from 'src/modules/notifications/notification.entity';
import { Review } from 'src/modules/reviews/review.entity';
import { Bookmark } from 'src/modules/bookmarks/bookmark.entity';
import { Chapter } from 'src/modules/chapters/entities/chapter.entity';
import { Comment } from 'src/modules/interactions/comments/entities/comment.entity';
import { Challenge } from '../../modules/challenges/challenge.entity';
import { UserChallenge } from '../../modules/challenges/user-challenge.entity';
import { Achievement } from '../../modules/achievements/achievement.entity';
import { UserAchievement } from '../../modules/achievements/user-achievement.entity';
import { ReadingProgress } from '../../modules/reading-progress/reading-progress.entity';
import { ChapterScrollProgress } from '../../modules/reading-progress/chapter-scroll.entity';
import { Genre } from 'src/modules/genres/entities/genre.entity';
import { Tag } from 'src/modules/tags/entities/tag.entity';
import { BookMetadata } from 'src/modules/books/entities/book-metadata.entity';
import { Exchange } from 'src/modules/exchanges/entities/exchange.entity';
import { ContentReport } from 'src/modules/reports/content-report.entity';
import { Like } from 'src/modules/interactions/likes/entities/like.entity';

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
    Category,
    Notification,
    Review,
    Bookmark,
    Chapter,
    Comment,
    Genre,
    Tag,
    BookMetadata,
    Challenge,
    UserChallenge,
    Achievement,
    UserAchievement,
    ReadingProgress,
    ChapterScrollProgress,
    Exchange,
    ContentReport,
    Like,
  ],
  synchronize: toBool(process.env.TYPEORM_SYNC, false),
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  migrationsRun: toBool(process.env.TYPEORM_MIGRATIONS_RUN, false),
};
