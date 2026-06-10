import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExchangeListingStatus,
  ExchangeRequestStatus,
} from '../../common/enums/exchange.enum';
import { CreateExchangeRequestDto } from './dto/create-exchange-request.dto';
import { ScheduleMeetingDto } from './dto/schedule-meeting.dto';
import { ExchangeRequest } from './entities/exchange-request.entity';
import { Exchange } from './entities/exchange.entity';

const requestRelations = [
  'exchange',
  'exchange.owner',
  'requester',
  'offeredExchange',
] as const;

@Injectable()
export class ExchangeRequestsService {
  constructor(
    @InjectRepository(ExchangeRequest)
    private readonly requestRepository: Repository<ExchangeRequest>,
    @InjectRepository(Exchange)
    private readonly exchangeRepository: Repository<Exchange>,
  ) {}

  async create(requesterId: string, dto: CreateExchangeRequestDto) {
    const exchange = await this.exchangeRepository.findOne({
      where: { id: dto.exchangeId },
    });

    if (!exchange) {
      throw new NotFoundException('Exchange listing not found');
    }

    if (exchange.listingStatus !== ExchangeListingStatus.ACTIVE) {
      throw new BadRequestException('This listing is no longer available');
    }

    if (exchange.userId === requesterId) {
      throw new BadRequestException('You cannot request your own listing');
    }

    const offeredExchange = await this.exchangeRepository.findOne({
      where: { id: dto.offeredExchangeId },
    });

    if (!offeredExchange) {
      throw new NotFoundException('Offered book listing not found');
    }

    if (offeredExchange.userId !== requesterId) {
      throw new ForbiddenException('You can only offer your own listings');
    }

    if (offeredExchange.listingStatus !== ExchangeListingStatus.ACTIVE) {
      throw new BadRequestException('Your offered listing is not active');
    }

    const existingPending = await this.requestRepository.findOne({
      where: {
        exchangeId: dto.exchangeId,
        requesterId,
        status: ExchangeRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'You already have a pending request for this listing',
      );
    }

    const request = this.requestRepository.create({
      exchangeId: dto.exchangeId,
      requesterId,
      offeredExchangeId: dto.offeredExchangeId,
      message: dto.message?.trim() || null,
      status: ExchangeRequestStatus.PENDING,
    });

    const saved = await this.requestRepository.save(request);
    return this.findOne(saved.id, requesterId);
  }

  async findIncoming(ownerId: string) {
    const requests = await this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.exchange', 'exchange')
      .leftJoinAndSelect('request.requester', 'requester')
      .leftJoinAndSelect('request.offeredExchange', 'offeredExchange')
      .where('exchange.userId = :ownerId', { ownerId })
      .orderBy('request.createdAt', 'DESC')
      .getMany();

    return requests.map((request) => this.toResponse(request));
  }

  async findMine(requesterId: string) {
    const requests = await this.requestRepository.find({
      where: { requesterId },
      relations: [...requestRelations],
      order: { createdAt: 'DESC' },
    });

    return requests.map((request) => this.toResponse(request));
  }

  async findOne(id: string, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: [...requestRelations],
    });

    if (!request) {
      throw new NotFoundException('Exchange request not found');
    }

    const isOwner = request.exchange.userId === userId;
    const isRequester = request.requesterId === userId;

    if (!isOwner && !isRequester) {
      throw new ForbiddenException('You do not have access to this trade');
    }

    return this.toResponse(request);
  }

  async accept(id: string, ownerId: string) {
    const request = await this.getOwnedRequest(id, ownerId);
    this.assertStatus(request, ExchangeRequestStatus.PENDING);
    request.status = ExchangeRequestStatus.ACCEPTED;
    await this.requestRepository.save(request);
    return this.findOne(id, ownerId);
  }

  async reject(id: string, ownerId: string) {
    const request = await this.getOwnedRequest(id, ownerId);
    this.assertStatus(request, ExchangeRequestStatus.PENDING);
    request.status = ExchangeRequestStatus.REJECTED;
    await this.requestRepository.save(request);
    return this.findOne(id, ownerId);
  }

  async cancel(id: string, requesterId: string) {
    const request = await this.getRequesterRequest(id, requesterId);
    if (
      request.status !== ExchangeRequestStatus.PENDING &&
      request.status !== ExchangeRequestStatus.ACCEPTED
    ) {
      throw new BadRequestException('This request can no longer be cancelled');
    }
    request.status = ExchangeRequestStatus.CANCELLED;
    await this.requestRepository.save(request);
    return this.findOne(id, requesterId);
  }

  async schedule(id: string, userId: string, dto: ScheduleMeetingDto) {
    const request = await this.getParticipantRequest(id, userId);
    this.assertStatus(request, ExchangeRequestStatus.ACCEPTED);
    request.meetingLocation = dto.meetingLocation;
    request.meetingTime = dto.meetingTime;
    request.status = ExchangeRequestStatus.MEETING_SCHEDULED;
    await this.requestRepository.save(request);
    return this.findOne(id, userId);
  }

  async complete(id: string, userId: string) {
    const request = await this.getParticipantRequest(id, userId);
    if (
      request.status !== ExchangeRequestStatus.ACCEPTED &&
      request.status !== ExchangeRequestStatus.MEETING_SCHEDULED
    ) {
      throw new BadRequestException('This trade cannot be completed yet');
    }

    request.status = ExchangeRequestStatus.COMPLETED;
    await this.requestRepository.save(request);

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

    return this.findOne(id, userId);
  }

  async hasPendingRequest(exchangeId: string, requesterId: string) {
    const pending = await this.requestRepository.findOne({
      where: {
        exchangeId,
        requesterId,
        status: ExchangeRequestStatus.PENDING,
      },
    });
    return { hasPending: Boolean(pending), requestId: pending?.id ?? null };
  }

  private async getOwnedRequest(id: string, ownerId: string) {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['exchange'],
    });

    if (!request) {
      throw new NotFoundException('Exchange request not found');
    }

    if (request.exchange.userId !== ownerId) {
      throw new ForbiddenException('Only the listing owner can perform this action');
    }

    return request;
  }

  private async getRequesterRequest(id: string, requesterId: string) {
    const request = await this.requestRepository.findOne({ where: { id } });

    if (!request) {
      throw new NotFoundException('Exchange request not found');
    }

    if (request.requesterId !== requesterId) {
      throw new ForbiddenException('Only the requester can perform this action');
    }

    return request;
  }

  private async getParticipantRequest(id: string, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['exchange'],
    });

    if (!request) {
      throw new NotFoundException('Exchange request not found');
    }

    const isParticipant =
      request.requesterId === userId || request.exchange.userId === userId;

    if (!isParticipant) {
      throw new ForbiddenException('You do not have access to this trade');
    }

    return request;
  }

  private assertStatus(
    request: ExchangeRequest,
    expected: ExchangeRequestStatus,
  ) {
    if (request.status !== expected) {
      throw new BadRequestException(
        `Request must be in ${expected} status to perform this action`,
      );
    }
  }

  private toResponse(request: ExchangeRequest) {
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
            condition: request.exchange.condition,
            tradingFor: request.exchange.tradingFor,
            exchangeType: request.exchange.exchangeType,
            owner: request.exchange.owner
              ? {
                  id: request.exchange.owner.id,
                  name: request.exchange.owner.name,
                  avatarUrl: request.exchange.owner.avatarUrl,
                }
              : null,
          }
        : null,
      requester: request.requester
        ? {
            id: request.requester.id,
            name: request.requester.name,
            avatarUrl: request.requester.avatarUrl,
          }
        : null,
      offeredExchange: request.offeredExchange
        ? {
            id: request.offeredExchange.id,
            title: request.offeredExchange.title,
            author: request.offeredExchange.author,
            imageUrl: request.offeredExchange.imageUrl,
            location: request.offeredExchange.location,
            condition: request.offeredExchange.condition,
          }
        : null,
    };
  }
}
