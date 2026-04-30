import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { Book } from '../books/book.entity';
import { ChapterType } from '../common/enums';
import { Comment } from '../comments/comment.entity';
import { ReadingProgress } from '../reading-progress/reading-progress.entity';

@Entity('chapters')
export class Chapter extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'int' })
  chapter_number: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ChapterType, default: ChapterType.CHAPTER })
  chapter_type: ChapterType;

  @Column({ default: 'PUBLISHED' })
  status: string;

  @Column({ nullable: true })
  published_at?: Date;

  @Column({ type: 'uuid' })
  book_id: string;

  // Relations
  @ManyToOne(() => Book, (book) => book.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @OneToMany(() => Comment, (comment) => comment.chapter, { cascade: true })
  comments: Comment[];

  @OneToMany(() => ReadingProgress, (progress) => progress.chapter)
  reading_progress: ReadingProgress[];
}
