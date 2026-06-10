import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/entities/genre.entity';
import { Tag } from '../tags/entities/tag.entity';
import { BookMetadata } from './entities/book-metadata.entity';
import { BookStatus } from 'src/common/enums/book-status.enum';
import { Review } from '../reviews/review.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Like } from '../interactions/likes/entities/like.entity';

@Entity('book')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text', { default: '' })
  description!: string;

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.DRAFT,
  })
  status!: BookStatus;

  @Column({ default: true })
  isFree!: boolean;

  @Column({
    type: 'float',
    default: 0,
  })
  rating!: number;

  @Column({ default: 0 })
  readCount?: number;

  @Column({ default: 0 })
  likeCount?: number;

  @Column('text', { nullable: true })
  tableOfContents?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ default: false })
  isPurchasable!: boolean;

  @Column({ default: false })
  isPremium!: boolean;

  @ManyToOne(() => User, (user) => user.books, {
    onDelete: 'CASCADE',
  })
  author!: User;

  @ManyToOne(() => Genre, (genre) => genre.books, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  genre?: Genre;

  @ManyToMany(() => Category, (category) => category.books, {
    cascade: true,
  })
  @JoinTable()
  categories!: Category[];

  @ManyToMany(() => Tag, (tag) => tag.books, {
    cascade: true,
  })
  @JoinTable()
  tags!: Tag[];

  @OneToOne(() => BookMetadata, (metadata) => metadata.book, {
    cascade: true,
    eager: true,
  })
  metadata?: BookMetadata;

  @OneToMany(() => Review, (review) => review.book)
  reviews!: Review[];

  @OneToMany(() => Like, (like) => like.book)
  likes!: Like[];

  @OneToMany(() => Chapter, (chapter) => chapter.book)
  chapters!: Chapter[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
