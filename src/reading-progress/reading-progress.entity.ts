import { Column, Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Chapter } from '../chapters/chapter.entity';

@Entity('reading_progress')
@Unique(['user_id', 'chapter_id'])
export class ReadingProgress extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  chapter_id: string;

  @Column({ type: 'int', default: 0 })
  progress_percent: number;

  @Column({ default: false })
  is_completed: boolean;

  @Column({ nullable: true })
  last_read_at?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.reading_progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Chapter, (chapter) => chapter.reading_progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;
}
