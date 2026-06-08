import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { User } from '../users/user.entity';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow extends BaseEntity {
  @Column({ type: 'uuid' })
  followerId!: string;

  @Column({ type: 'uuid' })
  followingId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followingId' })
  following!: User;
}
