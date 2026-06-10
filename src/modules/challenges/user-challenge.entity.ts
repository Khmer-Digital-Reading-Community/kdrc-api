import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Challenge } from './challenge.entity';

@Entity('user_challenges')
@Unique(['userId', 'challengeId'])
export class UserChallenge extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  challengeId!: string;

  @Column({ type: 'int', default: 0 })
  completedBooks!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ default: false })
  expired!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt?: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  challenge?: Challenge;
}
