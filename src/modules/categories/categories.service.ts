import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');
  }

  async create(name: string) {
    const slug = this.generateSlug(name);

    const exists = await this.repo.findOne({
      where: [{ name }, { slug }],
    });

    if (exists) {
      throw new BadRequestException('Category already exists');
    }

    const category = this.repo.create({
      name,
      slug,
    });

    return this.repo.save(category);
  }

  async findBySlug(slug: string) {
    return this.repo.findOne({
      where: { slug },
      relations: ['books'],
    });
  }
}
