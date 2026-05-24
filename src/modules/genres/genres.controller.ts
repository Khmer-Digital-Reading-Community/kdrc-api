import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { GenreService } from './genres.service';
import { CreateGenreDto, UpdateGenreDto } from './dto/create-genre.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('genres')
export class GenreController {
  constructor(private genreService: GenreService) {}

  @Get()
  async findAll() {
    return this.genreService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.genreService.findById(parseInt(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createGenreDto: CreateGenreDto) {
    return this.genreService.create(createGenreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    await this.genreService.delete(parseInt(id));
    return { message: 'Genre deleted' };
  }
}
