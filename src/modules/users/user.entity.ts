import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { Role } from 'src/common/enums/role.enum';
import { Book } from '../books/book.entity';
import { Notification } from '../notifications/notification.entity';
import { Review } from '../reviews/review.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true, select: false })
  password!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.WRITER,
  })
  role!: Role;

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true })
  providerId?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true, select: false })
  refreshToken?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  credits!: number;

  @OneToMany(() => Book, (book) => book.author)
  books!: Book[];

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications!: Notification[];

  @OneToMany(() => Review, (review) => review.reviewer)
  reviews!: Review[];
}
