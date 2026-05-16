import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingProgress } from './reading-progress.entity';

@Injectable()
export class ReadingProgressService {
    constructor(
        @InjectRepository(ReadingProgress)
        private repo: Repository<ReadingProgress>,
    ) {}

    findByUser(userId: string) {
        return this.repo.find({
            where: { user: { id: userId } },
            relations: ['book', 'chapter'],
            order: { lastReadAt: 'DESC' },
        });
    }
}
