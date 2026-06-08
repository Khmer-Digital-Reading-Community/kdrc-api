import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReadingListsService } from './reading-lists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReadingListDto } from './dto/create-reading-list.dto';
import { UpdateReadingListDto } from './dto/update-reading-list.dto';
import { AddBookToListDto } from './dto/add-book-to-list.dto';

@Controller('reading-lists')
export class ReadingListsController {
  constructor(private readonly readingListsService: ReadingListsService) {}

  // ── Public ──

  @Get()
  findAll() {
    return this.readingListsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.readingListsService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMy(@Req() req) {
    return this.readingListsService.findByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readingListsService.findOne(id);
  }

  // ── Authenticated mutations ──

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateReadingListDto) {
    return this.readingListsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateReadingListDto,
  ) {
    return this.readingListsService.update(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.readingListsService.remove(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/books')
  addBook(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AddBookToListDto,
  ) {
    return this.readingListsService.addBook(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/books/:bookId')
  removeBook(
    @Req() req,
    @Param('id') id: string,
    @Param('bookId') bookId: string,
  ) {
    return this.readingListsService.removeBook(req.user.id, id, bookId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reorder')
  reorder(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { bookIds: string[] },
  ) {
    return this.readingListsService.reorder(req.user.id, id, body.bookIds);
  }
}
