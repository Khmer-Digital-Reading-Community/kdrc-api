import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entities';
import { User } from '../users/user.entity';
import { Book } from '../books/book.entity';
import { Chapter } from '../books/chapter.entity';

@Entity('reading_progress')
@Unique(['user', 'book'])
export class ReadingProgress extends BaseEntity {
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @ManyToOne(() => Book, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bookId' })
    book!: Book;

    @ManyToOne(() => Chapter, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'chapterId' })
    chapter?: Chapter;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    percentageCompleted!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastReadAt!: Date;
}
