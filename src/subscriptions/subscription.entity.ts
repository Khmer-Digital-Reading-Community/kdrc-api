import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { User } from '../users/user.entity';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ type: 'uuid' })
  user_id: string;

  @Column()
  plan_name: string;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ nullable: true })
  start_date?: Date;

  @Column({ nullable: true })
  end_date?: Date;

  @Column({ nullable: true })
  auto_renew?: boolean;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
