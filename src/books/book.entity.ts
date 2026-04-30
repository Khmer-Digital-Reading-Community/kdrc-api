import { Column, Entity, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entities';
import { User } from '../users/user.entity';
import { BookStatus } from '../common/enums';
import { Chapter } from '../chapters/chapter.entity';
import { Review } from '../reviews/review.entity';
import { Bookmark } from '../bookmarks/bookmark.entity';
import { Genre } from '../genres/genre.entity';

@Entity('books')
export class Book extends BaseEntity {
  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  cover_image_url?: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ type: 'float', default: 0 })
  total_rating: number;

  @Column({ default: false })
  is_premium: boolean;

  @Column({ default: false })
  is_published: boolean;

  @Column({ type: 'enum', enum: BookStatus, default: BookStatus.DRAFT })
  status: BookStatus;

  @Column({ type: 'int', default: 0 })
  total_views: number;

  @Column({ type: 'uuid' })
  author_id: string;

  // Relations
  @ManyToOne(() => User, (user) => user.authored_books, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @OneToMany(() => Chapter, (chapter) => chapter.book, { cascade: true })
  chapters: Chapter[];

  @OneToMany(() => Review, (review) => review.book, { cascade: true })
  reviews: Review[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.book)
  bookmarks: Bookmark[];

  @ManyToMany(() => Genre, (genre) => genre.books, { cascade: true })
  @JoinTable({
    name: 'book_genres',
    joinColumn: { name: 'book_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Genre[];
}
