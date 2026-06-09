import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './purchase.entity';
import { Book } from '../books/book.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { User } from '../users/user.entity';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, Book, Chapter, User])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
