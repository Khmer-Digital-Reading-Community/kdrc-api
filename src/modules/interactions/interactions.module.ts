import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 1. Import the Like entity
import { Like } from './likes/entities/like.entity';
// 2. Import the Controller and Service
import { LikesController } from './likes/likes.controller';
import { LikesService } from './likes/likes.service';

// Import other entities needed by the LikesService
import { Book } from 'src/modules/books/book.entity';
import { Chapter } from 'src/modules/chapters/entities/chapter.entity';
import { Comment } from './comments/entities/comment.entity';

// (Keep your existing Comments imports here if you have them)
// import { CommentsController } from './comments/comments.controller';
// import { CommentsService } from './comments/comments.service';

@Module({
  imports: [
    // 3. Tell TypeORM about these entities so we can inject them into the Service
    TypeOrmModule.forFeature([Like, Book, Chapter, Comment]),
  ],
  controllers: [
    // 4. ✅ REGISTER THE CONTROLLER HERE
    LikesController,
    // CommentsController,
  ],
  providers: [
    // 5. ✅ REGISTER THE SERVICE HERE
    LikesService,
    // CommentsService,
  ],
  exports: [LikesService],
})
export class InteractionsModule {}