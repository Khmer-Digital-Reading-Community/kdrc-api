import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  // Specific named routes must come before the parameterised :id route
  // so Express/NestJS doesn't accidentally shadow them.
  @UseGuards(JwtAuthGuard)
  @Get('me/list')
  getMyBooks(@Req() req) {
    return this.booksService.findAuthorBooks(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  getMyStats(@Req() req) {
    return this.booksService.getAuthorStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBookDto, @Req() req) {
    return this.booksService.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/covers',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname) || '.png';
          cb(null, `cover-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only image files are allowed') as any,
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadCover(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Cover image is required');
    }
    return { url: `/uploads/covers/${file.filename}` };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookDto, @Req() req) {
    return this.booksService.update(id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.booksService.remove(id, req.user);
  }
}
