import { User } from 'src/modules/users/user.entity';
import { Chapter } from '../../../chapters/entities/chapter.entity';
import { CommentStatus } from 'src/common/enums/comment-status.enum';
import { Like } from '../../likes/entities/like.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
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

  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Chapter, { onDelete: 'CASCADE' })
  chapter!: Chapter;

  @OneToMany(() => Like, (like) => like.comment)
  likes!: Like[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
