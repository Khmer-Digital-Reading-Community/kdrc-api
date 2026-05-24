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
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateBookDto } from './dto/update-book.dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Controller('books')
export class BooksController {
  constructor(
    private booksService: BooksService,
    private cloudinaryService: CloudinaryService,
  ) {}

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

  @Get(':id/basic')
  findOneBasic(@Param('id') id: string) {
    return this.booksService.findOneBasic(id);
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
  async uploadCover(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      console.error('No file received in uploadCover endpoint');
      throw new BadRequestException('Cover image is required');
    }

    console.log('File received:', {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding,
    });

    try {
      const result = await this.cloudinaryService.uploadBookCover(file);
      console.log('Upload successful:', {
        public_id: result.public_id,
        secure_url: result.secure_url,
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        size: result.bytes,
      };
    } catch (error: any) {
      console.error('Upload error:', {
        message: error.message,
        error: error,
      });
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
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
