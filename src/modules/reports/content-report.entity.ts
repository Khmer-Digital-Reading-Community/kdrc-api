import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under review',
  RESOLVED = 'resolved',
}

@Entity('content_reports')
export class ContentReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: string;

  @Column('text')
  description!: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status!: ReportStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  reporter?: User;

  @Column({ nullable: true })
  reporterId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  reportedUser?: User;

  @Column({ nullable: true })
  reportedUserId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
