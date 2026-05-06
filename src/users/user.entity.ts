import { Column, Entity ,OneToMany} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { Bookmark } from '../modules/bookmarks/bookmark.entity';
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

  @Column({ default: 'reader' }) 
  role: string;
  
  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ nullable: true })
  provider?: string; 

  @Column({ nullable: true })
  providerId?: string;

  // --- ADD THIS TO FIX THE ERROR ---
  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Bookmark[];
}
