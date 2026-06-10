import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from 'src/modules/users/user.entity';
import { Book } from 'src/modules/books/book.entity';
import { Chapter } from 'src/modules/chapters/entities/chapter.entity';
import { Comment } from 'src/modules/interactions/comments/entities/comment.entity';

@Entity('likes')
// These unique constraints prevent a user from liking the same item twice.
@Unique(['userId', 'bookId'])
@Unique(['userId', 'chapterId'])
@Unique(['userId', 'commentId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;

  // Polymorphic relations (Only ONE of these will be populated per row)
  @ManyToOne(() => Book, (book) => book.likes, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookId' })
  book?: Book;

  @Column({ type: 'uuid', nullable: true })
  bookId?: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.likes, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chapterId' })
  chapter?: Chapter;

  @Column({ type: 'uuid', nullable: true })
  chapterId?: string;

  @ManyToOne(() => Comment, (comment) => comment.likes, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment?: Comment;

  @Column({ type: 'uuid', nullable: true })
  commentId?: string;
}
