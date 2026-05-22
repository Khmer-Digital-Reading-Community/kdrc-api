import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from './entities/chapter.entity';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { Book } from '../books/book.entity';
import { ReadingProgress } from '../reading-progress/reading-progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Book, ReadingProgress])],
  controllers: [ChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
