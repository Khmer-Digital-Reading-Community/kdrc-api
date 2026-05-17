import { Controller, Get, Param } from '@nestjs/common';
import { ChaptersService } from './chapters.service';

@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chaptersService.findOne(id);
  }
}
