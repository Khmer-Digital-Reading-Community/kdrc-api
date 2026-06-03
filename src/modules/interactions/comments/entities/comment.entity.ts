import { User } from 'src/modules/users/user.entity';
import { Chapter } from '../../../chapters/entities/chapter.entity';
import { CommentStatus } from 'src/common/enums/comment-status.enum';
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

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.APPROVED,
  })
  status!: CommentStatus;

  @Column({ type: 'text', nullable: true })
  moderatorNotes?: string;

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
