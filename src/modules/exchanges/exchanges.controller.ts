import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';
import { ExchangesService } from './exchanges.service';

@Controller('exchanges')
export class ExchangesController {
  constructor(
    private readonly exchangesService: ExchangesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() createExchangeDto: CreateExchangeDto,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadBookCover(file);
      if (result?.secure_url) {
        createExchangeDto.imageUrl = result.secure_url;
      }
    }

    if (!createExchangeDto.imageUrl) {
      throw new BadRequestException('A book cover image is required');
    }

    return this.exchangesService.create(createExchangeDto, req.user.id);
  }

  @Get()
  findAll(
    @Query() query: { search?: string; condition?: string; location?: string; page?: string; limit?: string },
  ) {
    return this.exchangesService.searchExchanges(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Req() req) {
    return this.exchangesService.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exchangesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Req() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateExchangeDto: UpdateExchangeDto,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadBookCover(file);
      if (result?.secure_url) {
        updateExchangeDto.imageUrl = result.secure_url;
      }
    }

    return this.exchangesService.update(id, updateExchangeDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.exchangesService.remove(id, req.user.id);
  }
}
