import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { Role } from '../auth/roles.enum';
import { Book } from '../books/book.entity';

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

  @Column({ nullable: true, select: false })
  refreshToken?: string;

  @OneToMany(() => Book, (book) => book.author)
  books!: Book[];
}
