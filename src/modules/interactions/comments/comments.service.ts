import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  async create(userId: string, createCommentDto: CreateCommentDto) {
    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      pageNumber: createCommentDto.pageNumber,
      user: { id: userId }, // Link to the user who made the comment
      chapter: { id: createCommentDto.bookId }, // Link to the chapter
    });
    return await this.commentsRepository.save(comment);
  }

  async findByBookAndPage(bookId: string, pageNumber: number) {
    return await this.commentsRepository.find({
      where: {
        chapter: { id: bookId },
        pageNumber,
      },
      relations: {
        user: true,
        chapter: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async update(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    // Security check: Only the owner can edit
    if (comment.user.id !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = updateCommentDto.content;
    return await this.commentsRepository.save(comment);
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    // Security check; Only the owner can delete
    if (comment.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return await this.commentsRepository.remove(comment);
  }
}
