import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingList } from './reading-list.entity';
import { ReadingListItem } from './reading-list-item.entity';
import { Book } from '../books/book.entity';
import { CreateReadingListDto } from './dto/create-reading-list.dto';
import { UpdateReadingListDto } from './dto/update-reading-list.dto';
import { AddBookToListDto } from './dto/add-book-to-list.dto';

@Injectable()
export class ReadingListsService {
  constructor(
    @InjectRepository(ReadingList)
    private readonly listRepo: Repository<ReadingList>,

    @InjectRepository(ReadingListItem)
    private readonly itemRepo: Repository<ReadingListItem>,

    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async create(ownerId: string, dto: CreateReadingListDto) {
    const list = this.listRepo.create({
      name: dto.name,
      description: dto.description,
      isPublic: dto.isPublic ?? true,
      ownerId,
    });
    const saved = await this.listRepo.save(list);

    if (dto.bookIds?.length) {
      const items = dto.bookIds.map((bookId, i) =>
        this.itemRepo.create({
          readingListId: saved.id,
          bookId,
          position: i,
        }),
      );
      await this.itemRepo.save(items);
    }

    return this.findOne(saved.id);
  }

  async findAll() {
    return this.listRepo.find({
      where: { isPublic: true },
      relations: ['owner', 'items', 'items.book'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(ownerId: string) {
    return this.listRepo.find({
      where: { ownerId },
      relations: ['items', 'items.book'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const list = await this.listRepo.findOne({
      where: { id },
      relations: ['owner', 'items', 'items.book'],
    });
    if (!list) throw new NotFoundException('Reading list not found');
    return list;
  }

  async update(ownerId: string, id: string, dto: UpdateReadingListDto) {
    const list = await this.findOne(id);
    if (list.ownerId !== ownerId) throw new ForbiddenException();
    Object.assign(list, dto);
    return this.listRepo.save(list);
  }

  async remove(ownerId: string, id: string) {
    const list = await this.findOne(id);
    if (list.ownerId !== ownerId) throw new ForbiddenException();
    await this.listRepo.remove(list);
    return { deleted: true };
  }

  async addBook(ownerId: string, listId: string, dto: AddBookToListDto) {
    const list = await this.findOne(listId);
    if (list.ownerId !== ownerId) throw new ForbiddenException();

    const book = await this.bookRepo.findOne({ where: { id: dto.bookId } });
    if (!book) throw new NotFoundException('Book not found');

    const exists = await this.itemRepo.findOne({
      where: { readingListId: listId, bookId: dto.bookId },
    });
    if (exists) throw new BadRequestException('Book already in this list');

    const item = this.itemRepo.create({
      readingListId: listId,
      bookId: dto.bookId,
      position: dto.position ?? 0,
    });

    return this.itemRepo.save(item);
  }

  async removeBook(ownerId: string, listId: string, bookId: string) {
    const list = await this.findOne(listId);
    if (list.ownerId !== ownerId) throw new ForbiddenException();

    const item = await this.itemRepo.findOne({
      where: { readingListId: listId, bookId },
    });
    if (!item) throw new NotFoundException('Book not in this list');

    await this.itemRepo.remove(item);
    return { deleted: true };
  }

  async reorder(ownerId: string, listId: string, bookIds: string[]) {
    const list = await this.findOne(listId);
    if (list.ownerId !== ownerId) throw new ForbiddenException();

    const updates = bookIds.map((bookId, position) =>
      this.itemRepo.update(
        { readingListId: listId, bookId },
        { position },
      ),
    );

    await Promise.all(updates);
    return this.findOne(listId);
  }
}
