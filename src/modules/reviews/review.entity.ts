import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'numeric', precision: 2, scale: 1 })
  rating!: number;

  @Column('text', { nullable: true })
  comment?: string;

  @ManyToOne(() => User, (user) => user.reviews, {
    onDelete: 'CASCADE',
  })
  reviewer!: User;

  @Column({ nullable: true })
  reviewerId?: string;

  @ManyToOne(() => Book, (book) => book.reviews, {
    onDelete: 'CASCADE',
  })
  book!: Book;

  @Column({ nullable: true })
  bookId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
