import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { CommentStatus } from 'src/common/enums/comment-status.enum';

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
      status: CommentStatus.APPROVED,
      user: { id: userId },
      chapter: { id: createCommentDto.chapterId },
      parentId: createCommentDto.parentId,
    });
    return await this.commentsRepository.save(comment);
  }

  async findAllAdmin(query: QueryCommentsDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const sortColumnMap: Record<string, string> = {
      content: 'comment.content',
      user: 'user.name',
      createdAt: 'comment.createdAt',
      status: 'comment.status',
      updatedAt: 'comment.updatedAt',
    };
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder =
      (query.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const orderColumn = sortColumnMap[sortBy] ?? 'comment.createdAt';

    const qb = this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.chapter', 'chapter')
      .orderBy(orderColumn, sortOrder)
      .skip(skip)
      .take(limit);

    if (query.status) {
      qb.andWhere('comment.status = :status', { status: query.status });
    }

    if (query.search?.trim()) {
      qb.andWhere('comment.content ILIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((comment) => ({
        id: comment.id,
        content: comment.content,
        chapterId: comment.chapter?.id,
        chapter: comment.chapter
          ? {
              id: comment.chapter.id,
              title: comment.chapter.title,
              chapterNumber: comment.chapter.chapterNumber,
            }
          : null,
        userId: comment.user?.id,
        user: comment.user
          ? {
              id: comment.user.id,
              email: comment.user.email,
              name: comment.user.name,
            }
          : null,
        likes: 0,
        status: comment.status,
        moderatorNotes: comment.moderatorNotes,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async approve(commentId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    comment.status = CommentStatus.APPROVED;
    comment.moderatorNotes = undefined;
    return this.commentsRepository.save(comment);
  }

  async reject(commentId: string, moderatorNotes?: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    comment.status = CommentStatus.REJECTED;
    comment.moderatorNotes = moderatorNotes;
    return this.commentsRepository.save(comment);
  }

  async adminRemove(commentId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.commentsRepository.remove(comment);
  }

  async adminBulkRemove(commentIds: string[]) {
    const comments = await this.commentsRepository.find({
      where: { id: In(commentIds) },
    });
    if (comments.length === 0) {
      throw new NotFoundException('No comments found for the provided ids');
    }
    await this.commentsRepository.remove(comments);
    return { deleted: comments.length };
  }

  async findByBookAndPage(chapterId: string, pageNumber: number) {
    return await this.commentsRepository.find({
      where: [
        {
          chapter: { id: chapterId },
          pageNumber,
          status: CommentStatus.APPROVED,
        },
        {
          chapter: { id: chapterId },
          pageNumber,
          status: CommentStatus.PENDING,
        },
      ],
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
      relations: { user: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    if (!comment.user || comment.user.id !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = updateCommentDto.content;
    return await this.commentsRepository.save(comment);
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: { user: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    if (!comment.user || comment.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return await this.commentsRepository.remove(comment);
  }
}
