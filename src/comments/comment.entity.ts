import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Chapter } from '../chapters/chapter.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ type: 'text' })
  comment_text: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  chapter_id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_comment_id?: string;

  // Relations
  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Chapter, (chapter) => chapter.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @ManyToOne(() => Comment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_comment_id' })
  parent_comment: Comment;
}
