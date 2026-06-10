import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExchangeRequestStatus } from '../../../common/enums/exchange.enum';
import { User } from '../../users/user.entity';
import { Exchange } from './exchange.entity';

@Entity('exchange_requests')
export class ExchangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Exchange, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exchangeId' })
  exchange!: Exchange;

  @Column()
  exchangeId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requesterId' })
  requester!: User;

  @Column()
  requesterId!: string;

  @ManyToOne(() => Exchange, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'offeredExchangeId' })
  offeredExchange?: Exchange | null;

  @Column({ type: 'text', nullable: true })
  offeredExchangeId?: string | null;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @Column({
    type: 'enum',
    enum: ExchangeRequestStatus,
    default: ExchangeRequestStatus.PENDING,
  })
  status!: ExchangeRequestStatus;

  @Column({ type: 'text', nullable: true })
  meetingLocation?: string | null;

  @Column({ type: 'text', nullable: true })
  meetingTime?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
