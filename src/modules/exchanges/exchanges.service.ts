import { Injectable } from '@nestjs/common';
import { CreateExchangeDto } from './dto/create-exchange.dto';
// import { UpdateExchangeDto } from './dto/update-exchange.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Exchange } from './entities/exchange.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExchangesService {
  constructor(
    @InjectRepository(Exchange)
    private readonly exchangeRepository: Repository<Exchange>,
  ) {}

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
}
