import { BookCondition, ExchangeType } from 'src/common/enums';
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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
