import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';
import { Chapter } from '../chapters/entities/chapter.entity';

@Entity('chapter_scroll_progress')
@Unique(['user', 'chapter'])
export class ChapterScrollProgress extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapterId' })
  chapter!: Chapter;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scrollPercentage!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastReadAt!: Date;
}
