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
} from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { BookStatus } from 'src/common/enums/book-status.enum';
import { Review } from '../reviews/review.entity';
import { Chapter } from '../chapters/entities/chapter.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.DRAFT,
  })
  status!: BookStatus;

  @Column({ nullable: true })
  language?: string;

  @Column({ nullable: true })
  genre?: string;

  @Column({ nullable: true, type: 'int' })
  pageCount?: number;

  @Column({ nullable: true })
  publisher?: string;

  @ManyToOne(() => User, (user) => user.books, {
    onDelete: 'CASCADE',
  })
  author!: User;

  @OneToMany(() => Review, (review) => review.book)
  reviews!: Review[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToMany(() => Category, (category) => category.books, {
    cascade: true,
  })
  @JoinTable()
  categories!: Category[];

  @OneToMany(() => Chapter, (chapter) => chapter.book)
  chapters!: Chapter[];
}
