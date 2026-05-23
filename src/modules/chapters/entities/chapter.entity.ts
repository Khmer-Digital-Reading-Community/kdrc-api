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

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => Book, (book) => book.chapters, {
    onDelete: 'CASCADE',
  })
  book!: Book;

  @Column()
  bookId!: string;

  @OneToMany(() => Comment, (comment) => comment.chapter)
  comments!: Comment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
