import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';

@Entity('reviews')
export class Review extends BaseEntity {
  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review_text?: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  book_id: string;

  // Relations
  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;
}
