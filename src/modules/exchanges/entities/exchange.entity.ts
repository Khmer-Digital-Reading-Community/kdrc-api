import {
  BookCondition,
  ExchangeListingStatus,
  ExchangeType,
} from '../../../common/enums/exchange.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { ExchangeRequest } from './exchange-request.entity';

@Entity('exchanges')
export class Exchange {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  author!: string;

  @Column()
  imageUrl!: string;

  @Column({ type: 'enum', enum: BookCondition })
  condition!: BookCondition;

  @Column({ type: 'enum', enum: ExchangeType })
  exchangeType!: ExchangeType;

  @Column()
  location!: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price!: number;

  @Column({ default: 'Open to Offers' })
  tradingFor!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string;

  @Column({ nullable: true })
  contactNumber?: string | null;

  @Column({
    type: 'enum',
    enum: ExchangeListingStatus,
    default: ExchangeListingStatus.ACTIVE,
  })
  listingStatus!: ExchangeListingStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  owner?: User | null;

  @Column({ nullable: true })
  userId?: string | null;

  @OneToMany(() => ExchangeRequest, (request) => request.exchange)
  requests!: ExchangeRequest[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
