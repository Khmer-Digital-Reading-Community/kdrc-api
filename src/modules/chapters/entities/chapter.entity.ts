import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Book } from '../../books/book.entity';
import { Comment } from '../../interactions/comments/entities/comment.entity';
import { ChapterType } from 'src/common/enums/chapter-type.enum';
import { ChapterStatus } from 'src/common/enums/chapter-status.enum';
// import { User } from 'src/modules/users/user.entity';
import { Like } from '../../interactions/likes/entities/like.entity';

export enum ChapterContentType {
  TEXT = 'text',
  TEXT_WITH_IMAGES = 'text-with-images',
  INTERACTIVE = 'interactive',
}

@Entity('chapters')
@Index(['bookId', 'chapterNumber'])
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column({ type: 'int' })
  chapterNumber!: number;

  @Column({
    type: 'enum',
    enum: ChapterType,
    default: ChapterType.CHAPTER,
  })
  type!: ChapterType;

  @Column({
    type: 'enum',
    enum: ChapterStatus,
    default: ChapterStatus.DRAFT,
  })
  status!: ChapterStatus;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({
    type: 'enum',
    enum: ChapterContentType,
    default: ChapterContentType.TEXT,
  })
  contentType!: ChapterContentType;

  @Column()
  bookId!: string;

  @OneToMany(() => Like, (like) => like.chapter)
  likes!: Like[];

  @ManyToOne(() => Book, (book) => book.chapters, {
    onDelete: 'CASCADE',
  })
  book!: Book;

  @OneToMany(() => Comment, (comment) => comment.chapter)
  comments!: Comment[];

  @Column({ type: 'int', default: 0 })
  wordCount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ default: false })
  isPurchasable!: boolean;

  @Column({ default: false })
  isPremium!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
