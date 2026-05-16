import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { Book } from './book.entity';
import { ChapterType } from 'src/common/enums/chapter-type.enum';

@Entity('chapters')
export class Chapter extends BaseEntity {
    @ManyToOne(() => Book, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bookId' })
    book!: Book;

    @Column()
    title!: string;

    @Column('text')
    content!: string;

    @Column()
    chapterNumber!: number;

    @Column({ type: 'enum', enum: ChapterType, default: ChapterType.CHAPTER })
    chapterType!: ChapterType;
}
