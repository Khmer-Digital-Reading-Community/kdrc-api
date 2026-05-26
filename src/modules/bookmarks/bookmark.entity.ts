import { Entity, ManyToOne, JoinColumn, Unique, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';
import { Chapter } from '../chapters/entities/chapter.entity';

// Define the two types of things a user can bookmark
export enum BookmarkType {
  BOOK = 'BOOK',
  CHAPTER = 'CHAPTER',
}

@Entity('bookmarks')
@Unique('UQ_USER_BOOK', ['userId', 'bookId'])
@Unique('UQ_USER_CHAPTER', ['userId', 'chapterId'])
export class Bookmark extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: BookmarkType,
    default: BookmarkType.BOOK,
  })
  type!: BookmarkType;

  @Column({ type: 'uuid', nullable: true })
  bookId?: string;

  @Column({ type: 'uuid', nullable: true })
  chapterId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Book, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'bookId' })
  book?: Book;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'chapterId' })
  chapter?: Chapter;
}
