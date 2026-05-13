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
import { Chapter } from '../chapters/entities/chapter.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @ManyToOne(() => User, (user) => user.books, {
    onDelete: 'CASCADE',
  })
  author!: User;

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
