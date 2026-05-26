import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { CreateGenreDto, UpdateGenreDto } from './dto/create-genre.dto';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private genreRepo: Repository<Genre>,
  ) {}

  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    const existing = await this.genreRepo.findOne({
      where: [{ slug: createGenreDto.slug }, { name: createGenreDto.name }],
    });

    if (existing) {
      throw new ConflictException('Genre with this name or slug already exists');
    }

    const genre = this.genreRepo.create(createGenreDto);
    return this.genreRepo.save(genre);
  }

  async findAll(): Promise<Genre[]> {
    return this.genreRepo.find({ order: { name: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<Genre> {
    const genre = await this.genreRepo.findOne({ where: { slug } });
    if (!genre) {
      throw new NotFoundException(`Genre with slug "${slug}" not found`);
    }
    return genre;
  }

  async findById(id: number): Promise<Genre> {
    const genre = await this.genreRepo.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre with id ${id} not found`);
    }
    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto): Promise<Genre> {
    const genre = await this.findById(id);
    Object.assign(genre, updateGenreDto);
    return this.genreRepo.save(genre);
  }

  async delete(id: number): Promise<void> {
    const genre = await this.findById(id);
    await this.genreRepo.remove(genre);
  }

  async getOrCreate(slug: string, name?: string): Promise<Genre> {
    try {
      return await this.findBySlug(slug);
    } catch {
      return this.create({
        slug,
        name: name || slug.replace('-', ' ').toUpperCase(),
      });
    }
  }
}
