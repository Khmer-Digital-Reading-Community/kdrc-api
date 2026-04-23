import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ default: 'en' })
  languagePreference: string;
  
  // Added for Manage User Roles task (Defaults to 'reader')
  @Column({ default: 'reader' }) 
  role: string;
  
  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ nullable: true })
  provider?: string; 

  @Column({ nullable: true })
  providerId?: string;
}
