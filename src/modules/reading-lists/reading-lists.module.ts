import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingList } from './reading-list.entity';
import { ReadingListItem } from './reading-list-item.entity';
import { ReadingListsService } from './reading-lists.service';
import { ReadingListsController } from './reading-lists.controller';
import { Book } from '../books/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReadingList, ReadingListItem, Book])],
  controllers: [ReadingListsController],
  providers: [ReadingListsService],
  exports: [ReadingListsService],
})
export class ReadingListsModule {}
