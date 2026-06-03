import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';

type AuthenticatedRequest = {
  user: {
    id: string;
    role?: Role;
  };
};

@Controller('comments')
export class CommentSController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAllAdmin(@Query() query: QueryCommentsDto) {
    return this.commentsService.findAllAdmin(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user.id, createCommentDto);
  }

  @Get('book/:bookId/page/:pageNumber')
  findByBookAndPage(
    @Param('bookId') bookId: string,
    @Param('pageNumber') pageNumber: number,
  ) {
    return this.commentsService.findByBookAndPage(bookId, pageNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.commentsService.approve(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: ModerateCommentDto) {
    return this.commentsService.reject(id, dto.moderatorNotes);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id/admin')
  adminRemove(@Param('id') id: string) {
    return this.commentsService.adminRemove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, req.user.id, updateCommentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.commentsService.remove(id, req.user.id);
  }
}
