import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from './entities/chapter.entity';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chaptersRepository: Repository<Chapter>,
  ) {}

  async findAll(bookId: string) {
    return this.chaptersRepository.find({
      where: { book: { id: bookId } },
      order: { chapterNumber: 'ASC' },
    });
  }

  async findOne(id: string) {
    const chapter = await this.chaptersRepository.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }
}
