import { Column, Entity, OneToMany, ManyToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { Book } from '../books/book.entity';

@Entity('genres')
export class Genre extends BaseEntity {
  @Column({ unique: true })
  name_en: string;

  @Column({ nullable: true })
  description?: string;

  // Relations
  @ManyToMany(() => Book, (book) => book.genres)
  books: Book[];
}
