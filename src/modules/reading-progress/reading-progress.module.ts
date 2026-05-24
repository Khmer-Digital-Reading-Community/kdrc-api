import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingProgress } from './reading-progress.entity';
import { ReadingProgressService } from './reading-progress.service';
import { ReadingProgressController } from './reading-progress.controller';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Book } from '../books/book.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ReadingProgress, Chapter,Book])],
    controllers: [ReadingProgressController],
    providers: [ReadingProgressService],
})
export class ReadingProgressModule {}
