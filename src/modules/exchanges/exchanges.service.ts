import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Exchange } from './entities/exchange.entity';
import { Repository } from 'typeorm';

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
    data: Exchange[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    const query = this.exchangeRepository.createQueryBuilder('exchange');
    // Dynamic by Search Term (Looks in Title OR Author)
    if (filters.search) {
      query.andWhere(
        `LOWER(exchange.title) LIKE LOWER(:search) OR LOWER(exchange.author) LIKE LOWER(:search)`,
        { search: `%${filters.search}%` },
      );
    }
    // Dynamic by Condition
    if (filters.condition) {
      query.andWhere('exchange.condition = :condition', {
        condition: filters.condition,
      });
    }
    // Dynamic by Location
    if (filters.location) {
      query.andWhere('exchange.location = :location', {
        location: filters.location,
      });
    }

    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 15;
    const skip = (page - 1) * limit;

    // getManyAndCount returns return the data AND the total total matching rows in the DB
    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1, // Calculate total pages
      },
    };
  }

  // save a new post to the database
  async create(createExchangeDto: CreateExchangeDto): Promise<Exchange> {
    const newPost = this.exchangeRepository.create(createExchangeDto);
    return await this.exchangeRepository.save(newPost);
  }

  // fetch all post for frontend grid
  async findAll(): Promise<Exchange[]> {
    return await this.exchangeRepository.find({
      order: { createdAt: 'DESC' }, // always show the newest posts first?
    });
  }

  // fetch a SINGLE post (for a book Detail Page)
  async findOne(id: string): Promise<Exchange> {
    const exchange = await this.exchangeRepository.findOne({ where: { id } });

    if (!exchange) {
      throw new NotFoundException(`Exchange post with ID ${id} not found`);
    }
    return exchange;
  }

  // Update an existing post
  async update(
    id: string,
    updateExchangeDto: UpdateExchangeDto,
  ): Promise<Exchange> {
    // first, ensure the post exist using our findONe method
    const existingExchange = await this.findOne(id);

    // Merge the new data inti existing object
    const updatedExchange = this.exchangeRepository.merge(
      existingExchange,
      updateExchangeDto,
    );

    return await this.exchangeRepository.save(updatedExchange);
  }

  // Delete a post
  async remove(id: string): Promise<void> {
    // Ensure it exist
    const exchange = await this.findOne(id);
    await this.exchangeRepository.remove(exchange);
  }
}
