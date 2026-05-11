import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { BookStatus } from 'src/common/enums/book-status.enum';

@Entity()
export class Book {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column('text')
    content!: string;

    @Column({
        type: 'enum',
        enum: BookStatus,
        default: BookStatus.DRAFT,
    })
    status!: BookStatus;

    @ManyToOne(() => User, (user) => user.books, {
        onDelete: 'CASCADE',
    })
    author!: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @ManyToMany(() => Category, (category) => category.books, {
        cascade: true,
    })
    @JoinTable()
    categories!: Category[];
}