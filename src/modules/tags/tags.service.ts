import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto, UpdateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const existing = await this.tagRepo.findOne({
      where: [{ slug: createTagDto.slug }, { name: createTagDto.name }],
    });

    if (existing) {
      throw new ConflictException('Tag with this name or slug already exists');
    }

    const tag = this.tagRepo.create(createTagDto);
    return this.tagRepo.save(tag);
  }

  async findAll(limit = 50, offset = 0): Promise<{ data: Tag[]; total: number }> {
    const [data, total] = await this.tagRepo.findAndCount({
      order: { name: 'ASC' },
      take: limit,
      skip: offset,
    });
    return { data, total };
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepo.findOne({ where: { slug } });
    if (!tag) {
      throw new NotFoundException(`Tag with slug "${slug}" not found`);
    }
    return tag;
  }

  async findById(id: string): Promise<Tag> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with id "${id}" not found`);
    }
    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findById(id);
    Object.assign(tag, updateTagDto);
    return this.tagRepo.save(tag);
  }

  async delete(id: string): Promise<void> {
    const tag = await this.findById(id);
    await this.tagRepo.remove(tag);
  }

  async getOrCreateBySlug(slug: string, name?: string): Promise<Tag> {
    try {
      return await this.findBySlug(slug);
    } catch {
      return this.create({
        slug,
        name: name || slug.replace('-', ' ').toUpperCase(),
      });
    }
  }

  async findBySlugs(slugs: string[]): Promise<Tag[]> {
    return this.tagRepo.find({
      where: slugs.map((slug) => ({ slug })),
    });
  }
}
