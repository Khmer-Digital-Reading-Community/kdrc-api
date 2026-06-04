import {
  BookCondition,
  ExchangeType,
} from '../../../common/enums/exchange.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exchanges') // this will be the name of the table in PostgreSQL
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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
