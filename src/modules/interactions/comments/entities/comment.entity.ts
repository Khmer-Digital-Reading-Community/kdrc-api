import { User } from 'src/modules/users/user.entity';
import { Chapter } from '../../../chapters/entities/chapter.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  // Optional: You can add a reference to the user who made the comment
  @Column({ nullable: true })
  pageNumber?: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  chapter!: Chapter;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
