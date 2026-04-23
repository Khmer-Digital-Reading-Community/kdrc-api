import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { Role } from 'src/auth/roles.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.READER,
  })
  role: Role;

  @Column({ nullable: true })
  provider?: string;

  @Column({ nullable: true })
  providerId?: string;
}
