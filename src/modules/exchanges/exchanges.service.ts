import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeListingStatus } from '../../common/enums/exchange.enum';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';
import { Exchange } from './entities/exchange.entity';

@Injectable()
export class ExchangesService {
  constructor(
    @InjectRepository(Exchange)
    private readonly exchangeRepository: Repository<Exchange>,
  ) {}

  async searchExchanges(filters: {
    search?: string;
    condition?: string;
    location?: string;
    page?: string;
    limit?: string;
  }): Promise<{
    data: ReturnType<ExchangesService['toPublicExchange']>[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    const query = this.exchangeRepository
      .createQueryBuilder('exchange')
      .leftJoinAndSelect('exchange.owner', 'owner')
      .where('exchange.listingStatus = :status', {
        status: ExchangeListingStatus.ACTIVE,
      })
      .orderBy('exchange.createdAt', 'DESC');

    if (filters.search) {
      query.andWhere(
        `LOWER(exchange.title) LIKE LOWER(:search) OR LOWER(exchange.author) LIKE LOWER(:search)`,
        { search: `%${filters.search}%` },
      );
    }

    if (filters.condition) {
      query.andWhere('exchange.condition = :condition', {
        condition: filters.condition,
      });
    }

    if (filters.location) {
      query.andWhere('exchange.location = :location', {
        location: filters.location,
      });
    }

    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 15;
    const skip = (page - 1) * limit;

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((exchange) => this.toPublicExchange(exchange)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1,
      },
    };
  }

  async create(
    createExchangeDto: CreateExchangeDto,
    userId: string,
  ): Promise<ReturnType<ExchangesService['toPublicExchange']>> {
    const newPost = this.exchangeRepository.create({
      ...createExchangeDto,
      userId,
      listingStatus: ExchangeListingStatus.ACTIVE,
    });
    const saved = await this.exchangeRepository.save(newPost);
    return this.findOne(saved.id);
  }

  async findMine(userId: string) {
    const listings = await this.exchangeRepository.find({
      where: { userId },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });

    return listings.map((exchange) => this.toPublicExchange(exchange));
  }

  async findOne(id: string) {
    const exchange = await this.exchangeRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!exchange) {
      throw new NotFoundException(`Exchange post with ID ${id} not found`);
    }

    return this.toPublicExchange(exchange);
  }

  async update(
    id: string,
    updateExchangeDto: UpdateExchangeDto,
    userId: string,
  ) {
    const existingExchange = await this.exchangeRepository.findOne({
      where: { id },
    });

    if (!existingExchange) {
      throw new NotFoundException(`Exchange post with ID ${id} not found`);
    }

    if (existingExchange.userId && existingExchange.userId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    const updatedExchange = this.exchangeRepository.merge(
      existingExchange,
      updateExchangeDto,
    );

    const saved = await this.exchangeRepository.save(updatedExchange);
    return this.toPublicExchange(saved);
  }

  async remove(id: string, userId: string): Promise<void> {
    const exchange = await this.exchangeRepository.findOne({ where: { id } });

    if (!exchange) {
      throw new NotFoundException(`Exchange post with ID ${id} not found`);
    }

    if (exchange.userId && exchange.userId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.exchangeRepository.remove(exchange);
  }

  private toPublicExchange(exchange: Exchange) {
    return {
      id: exchange.id,
      title: exchange.title,
      author: exchange.author,
      imageUrl: exchange.imageUrl,
      condition: exchange.condition,
      exchangeType: exchange.exchangeType,
      location: exchange.location,
      price: exchange.price,
      tradingFor: exchange.tradingFor,
      description: exchange.description,
      contactNumber: exchange.contactNumber,
      listingStatus: exchange.listingStatus,
      createdAt: exchange.createdAt,
      updatedAt: exchange.updatedAt,
      owner: exchange.owner
        ? {
            id: exchange.owner.id,
            name: exchange.owner.name,
            avatarUrl: exchange.owner.avatarUrl,
            bio: exchange.owner.bio,
          }
        : null,
    };
  }
}
