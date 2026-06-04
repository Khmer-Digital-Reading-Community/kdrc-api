import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingProgress } from './reading-progress.entity';
import { ChapterScrollProgress } from './chapter-scroll.entity';
import { ReadingProgressService } from './reading-progress.service';
import { ChapterScrollService } from './chapter-scroll.service';
import { ReadingProgressController } from './reading-progress.controller';
import { ChapterScrollController } from './chapter-scroll.controller';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Book } from '../books/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReadingProgress, ChapterScrollProgress, Chapter, Book])],
  controllers: [ReadingProgressController, ChapterScrollController],
  providers: [ReadingProgressService, ChapterScrollService],
})
export class ReadingProgressModule {}
