import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { PaymentSessionStatus } from './enums/payment-session-status.enum';
import { PaymentItemType } from './enums/payment-item-type.enum';

@Entity('payment_sessions')
export class PaymentSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: PaymentItemType,
  })
  itemType!: PaymentItemType;

  @Column({ type: 'uuid' })
  itemId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: PaymentSessionStatus,
    default: PaymentSessionStatus.PENDING,
  })
  status!: PaymentSessionStatus;

  @Column({ default: 'manual' })
  processor!: string;

  @Column({ nullable: true })
  processorSessionId?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
