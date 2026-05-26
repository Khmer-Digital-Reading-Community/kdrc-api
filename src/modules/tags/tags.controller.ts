import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TagService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tags')
export class TagController {
  constructor(private tagService: TagService) {}

  @Get()
  async findAll(@Query('limit') limit = 50, @Query('offset') offset = 0) {
    return this.tagService.findAll(limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tagService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    await this.tagService.delete(id);
    return { message: 'Tag deleted' };
  }
}
