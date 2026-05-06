import { Entity, ManyToOne, JoinColumn, Unique, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity'; 

@Entity('bookmarks')
@Unique(['userId', 'bookId']) 
export class Bookmark extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  bookId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Relationship to Book
  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;
}