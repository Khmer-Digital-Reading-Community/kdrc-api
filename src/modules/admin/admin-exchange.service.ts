import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExchangeListingStatus,
  ExchangeRequestStatus,
} from '../../common/enums/exchange.enum';
import { ExchangeRequest } from '../exchanges/entities/exchange-request.entity';
import { Exchange } from '../exchanges/entities/exchange.entity';
import { AdminUpdateExchangeDto } from './dto/admin-update-exchange.dto';

@Injectable()
export class AdminExchangeService {
  constructor(
    @InjectRepository(Exchange)
    private readonly exchangeRepository: Repository<Exchange>,
    @InjectRepository(ExchangeRequest)
    private readonly requestRepository: Repository<ExchangeRequest>,
  ) {}

  async listListings(filters: {
    search?: string;
    listingStatus?: string;
    page?: string;
    limit?: string;
  }) {
    const query = this.exchangeRepository
      .createQueryBuilder('exchange')
      .leftJoinAndSelect('exchange.owner', 'owner')
      .orderBy('exchange.createdAt', 'DESC');

    if (filters.search) {
      query.andWhere(
        `LOWER(exchange.title) LIKE LOWER(:search) OR LOWER(exchange.author) LIKE LOWER(:search) OR LOWER(owner.name) LIKE LOWER(:search)`,
        { search: `%${filters.search}%` },
      );
    }

    if (filters.listingStatus) {
      query.andWhere('exchange.listingStatus = :listingStatus', {
        listingStatus: filters.listingStatus,
      });
    }

    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 15;
    const skip = (page - 1) * limit;

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((exchange) => this.toListingResponse(exchange)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateListing(id: string, dto: AdminUpdateExchangeDto) {
    const exchange = await this.exchangeRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!exchange) {
      throw new NotFoundException('Exchange listing not found');
    }

    if (dto.listingStatus) {
      exchange.listingStatus = dto.listingStatus;
    }

    const saved = await this.exchangeRepository.save(exchange);
    return this.toListingResponse(saved);
  }

  async deleteListing(id: string) {
    const exchange = await this.exchangeRepository.findOne({ where: { id } });
    if (!exchange) {
      throw new NotFoundException('Exchange listing not found');
    }
    await this.exchangeRepository.remove(exchange);
    return { deleted: true };
  }

  async listRequests(filters: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const query = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.exchange', 'exchange')
      .leftJoinAndSelect('exchange.owner', 'owner')
      .leftJoinAndSelect('request.requester', 'requester')
      .leftJoinAndSelect('request.offeredExchange', 'offeredExchange')
      .orderBy('request.createdAt', 'DESC');

    if (filters.status) {
      query.andWhere('request.status = :status', { status: filters.status });
    }

    if (filters.search) {
      query.andWhere(
        `LOWER(exchange.title) LIKE LOWER(:search) OR LOWER(offeredExchange.title) LIKE LOWER(:search) OR LOWER(requester.name) LIKE LOWER(:search) OR LOWER(owner.name) LIKE LOWER(:search)`,
        { search: `%${filters.search}%` },
      );
    }

    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 15;
    const skip = (page - 1) * limit;

    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data: data.map((request) => this.toRequestResponse(request)),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateRequestStatus(id: string, status: ExchangeRequestStatus) {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['exchange', 'exchange.owner', 'requester', 'offeredExchange'],
    });

    if (!request) {
      throw new NotFoundException('Exchange request not found');
    }

    request.status = status;

    if (status === ExchangeRequestStatus.COMPLETED) {
      await this.exchangeRepository.update(
        { id: request.exchangeId },
        { listingStatus: ExchangeListingStatus.CLOSED },
      );
      if (request.offeredExchangeId) {
        await this.exchangeRepository.update(
          { id: request.offeredExchangeId },
          { listingStatus: ExchangeListingStatus.CLOSED },
        );
      }
    }

    const saved = await this.requestRepository.save(request);
    return this.toRequestResponse(saved);
  }

  async deleteRequest(id: string) {
    const request = await this.requestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Exchange request not found');
    }
    await this.requestRepository.remove(request);
    return { deleted: true };
  }

  private toListingResponse(exchange: Exchange) {
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
      listingStatus: exchange.listingStatus,
      contactNumber: exchange.contactNumber,
      createdAt: exchange.createdAt,
      updatedAt: exchange.updatedAt,
      owner: exchange.owner
        ? {
            id: exchange.owner.id,
            name: exchange.owner.name,
            email: exchange.owner.email,
          }
        : null,
    };
  }

  private toRequestResponse(request: ExchangeRequest) {
    return {
      id: request.id,
      status: request.status,
      message: request.message,
      meetingLocation: request.meetingLocation,
      meetingTime: request.meetingTime,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      exchange: request.exchange
        ? {
            id: request.exchange.id,
            title: request.exchange.title,
            author: request.exchange.author,
            imageUrl: request.exchange.imageUrl,
            location: request.exchange.location,
            owner: request.exchange.owner
              ? {
                  id: request.exchange.owner.id,
                  name: request.exchange.owner.name,
                  email: request.exchange.owner.email,
                }
              : null,
          }
        : null,
      requester: request.requester
        ? {
            id: request.requester.id,
            name: request.requester.name,
            email: request.requester.email,
          }
        : null,
      offeredExchange: request.offeredExchange
        ? {
            id: request.offeredExchange.id,
            title: request.offeredExchange.title,
            author: request.offeredExchange.author,
            imageUrl: request.offeredExchange.imageUrl,
          }
        : null,
    };
  }
}
