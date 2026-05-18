import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UpdateCommentDto } from './dto/update-comment.dto';

type AuthenticatedRequest = {
  user: {
    id: string;
  };
};

@Controller('comments')
export class CommentSController {
  constructor(private readonly commentsService: CommentsService) {}

  // POST /comments
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    // req.user comes from JwtStategy
    return this.commentsService.create(req.user.id, createCommentDto);
  }

  // GET /comments/book/:bookId/page/:pageNumber
  @Get('book/:bookId/page/:pageNumber')
  findByBookAndPage(
    @Param('bookId') bookId: string,
    @Param('pageNumber') pageNumber: number,
  ) {
    return this.commentsService.findByBookAndPage(bookId, pageNumber);
  }

  // PATCH /comments/:Id
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, req.user.id, updateCommentDto);
  }

  // DELETE /comments/:id
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.commentsService.remove(id, req.user.id);
  }
}
