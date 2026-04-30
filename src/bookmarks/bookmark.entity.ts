import { Column, Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';
import { Chapter } from '../chapters/chapter.entity';

@Entity('bookmarks')
@Unique(['user_id', 'book_id', 'chapter_id'])
export class Bookmark extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  book_id: string;

  @Column({ type: 'uuid' })
  chapter_id: string;

  // Relations
  @ManyToOne(() => User, (user) => user.bookmarks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.bookmarks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;
}
