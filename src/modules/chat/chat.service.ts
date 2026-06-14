import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
  ) { }

  async create(userId: string, dto: CreateChatMessageDto): Promise<ChatMessage> {
    const msg = this.chatRepo.create({ content: dto.content, userId });
    const saved = await this.chatRepo.save(msg);
    return this.chatRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    }) as Promise<ChatMessage>;
  }

  async findAll(): Promise<ChatMessage[]> {
    return this.chatRepo.find({
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  // Admin: paginated list with optional search
  async findAllAdmin(query: {
    search?: string;
    page?: string;
    limit?: string;
  }): Promise<{ data: ChatMessage[]; total: number; page: number; limit: number }> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const qb = this.chatRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.user', 'user')
      .orderBy('msg.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.search?.trim()) {
      qb.andWhere(
        'msg.content ILIKE :search OR user.name ILIKE :search',
        { search: `%${query.search.trim()}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async remove(id: string): Promise<void> {
    const msg = await this.chatRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException(`Chat message ${id} not found`);
    await this.chatRepo.remove(msg);
  }

  async bulkRemove(ids: string[]): Promise<{ deleted: number }> {
    const msgs = await this.chatRepo.find({ where: { id: In(ids) } });
    await this.chatRepo.remove(msgs);
    return { deleted: msgs.length };
  }

  async getStats(): Promise<{ total: number; todayCount: number }> {
    const total = await this.chatRepo.count();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await this.chatRepo
      .createQueryBuilder('msg')
      .where('msg.createdAt >= :start', { start: startOfDay })
      .getCount();
    return { total, todayCount };
  }
}
