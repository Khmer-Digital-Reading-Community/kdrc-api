import { DataSourceOptions } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { Book } from 'src/modules/books/book.entity';
import { Category } from 'src/modules/categories/category.entity';
import { Chapter } from 'src/modules/books/chapter.entity';
import { ReadingProgress } from 'src/modules/reading-progress/reading-progress.entity';

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
  entities: [User, Book, Category, Chapter, ReadingProgress],
  synchronize: toBool(process.env.TYPEORM_SYNC, true),
  migrations: ['dist/migrations/*.js'],
  migrationsRun: toBool(process.env.TYPEORM_MIGRATIONS_RUN, false),
};
