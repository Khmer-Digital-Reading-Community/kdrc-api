import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { ReadingList } from './reading-list.entity';
import { Book } from '../books/book.entity';

@Entity('reading_list_items')
export class ReadingListItem extends BaseEntity {
  @Column({ type: 'uuid' })
  readingListId!: string;

  @Column({ type: 'uuid' })
  bookId!: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @ManyToOne(() => ReadingList, (list) => list.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'readingListId' })
  readingList!: ReadingList;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;
}
