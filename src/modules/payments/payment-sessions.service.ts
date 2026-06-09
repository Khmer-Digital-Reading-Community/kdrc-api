import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSession } from './payment-session.entity';
import { PaymentSessionStatus } from './enums/payment-session-status.enum';
import { PaymentItemType } from './enums/payment-item-type.enum';
import { InitiatePaymentDto, PaymentSessionResponse } from './dto/payment.dto';
import { PaymentProcessor } from './processors/payment-processor.interface';
import { ManualPaymentProcessor } from './processors/manual-payment.processor';
import { Book } from '../books/book.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { PurchasesService } from '../purchases/purchases.service';

@Injectable()
export class PaymentSessionsService {
  private processors: Map<string, PaymentProcessor> = new Map();

  constructor(
    @InjectRepository(PaymentSession)
    private readonly sessionRepo: Repository<PaymentSession>,

    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,

    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,

    private readonly purchasesService: PurchasesService,

    manualProcessor: ManualPaymentProcessor,
  ) {
    this.processors.set(manualProcessor.name, manualProcessor);
  }

  private getProcessor(name: string): PaymentProcessor {
    const processor = this.processors.get(name);
    if (!processor) throw new BadRequestException(`Unknown payment processor: ${name}`);
    return processor;
  }

  async createSession(
    userId: string,
    dto: InitiatePaymentDto,
    processorName = 'manual',
  ): Promise<PaymentSessionResponse> {
    const processor = this.getProcessor(processorName);

    let amount = 0;

    if (dto.itemType === PaymentItemType.BOOK) {
      const book = await this.bookRepo.findOne({ where: { id: dto.itemId } });
      if (!book) throw new NotFoundException('Book not found');
      if (!book.isPurchasable || Number(book.price) <= 0) {
        throw new BadRequestException('This book is not available for purchase');
      }
      amount = Number(book.price);
    } else {
      const chapter = await this.chapterRepo.findOne({
        where: { id: dto.itemId },
        relations: ['book'],
      });
      if (!chapter) throw new NotFoundException('Chapter not found');
      if (!chapter.isPurchasable || Number(chapter.price) <= 0) {
        throw new BadRequestException('This chapter is not available for purchase');
      }
      amount = Number(chapter.price);
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const session = this.sessionRepo.create({
      userId,
      itemType: dto.itemType,
      itemId: dto.itemId,
      amount,
      status: PaymentSessionStatus.PENDING,
      processor: processorName,
      expiresAt,
    });

    const processorResult = await processor.createSession(session);
    session.processorSessionId = processorResult.processorSessionId;
    await this.sessionRepo.save(session);

    return {
      id: session.id,
      itemType: session.itemType,
      itemId: session.itemId,
      amount: Number(session.amount),
      status: session.status,
      expiresAt: session.expiresAt,
      qrCodeData: processorResult.qrCodeData ?? '',
    };
  }

  async getSession(sessionId: string, userId: string): Promise<PaymentSessionResponse> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Payment session not found');

    const processor = this.getProcessor(session.processor);
    const status = await processor.checkStatus(session);

    if (status !== session.status) {
      session.status = status;
      await this.sessionRepo.save(session);
    }

    return {
      id: session.id,
      itemType: session.itemType,
      itemId: session.itemId,
      amount: Number(session.amount),
      status: session.status,
      expiresAt: session.expiresAt,
      qrCodeData: '',
    };
  }

  async confirmSession(sessionId: string, userId: string): Promise<PaymentSessionResponse> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Payment session not found');

    if (session.status !== PaymentSessionStatus.PENDING) {
      throw new BadRequestException(`Session is ${session.status.toLowerCase()}, cannot confirm`);
    }

    const processor = this.getProcessor(session.processor);
    const result = await processor.confirmPayment(session);

    if (result.confirmed) {
      if (session.itemType === PaymentItemType.BOOK) {
        await this.purchasesService.completeBookPurchaseWithoutCredits(
          userId,
          session.itemId,
        );
      } else {
        await this.purchasesService.completeChapterPurchaseWithoutCredits(
          userId,
          session.itemId,
        );
      }
    }

    await this.sessionRepo.save(session);

    return {
      id: session.id,
      itemType: session.itemType,
      itemId: session.itemId,
      amount: Number(session.amount),
      status: session.status,
      expiresAt: session.expiresAt,
      qrCodeData: '',
    };
  }

  async cancelSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Payment session not found');

    if (session.status !== PaymentSessionStatus.PENDING) {
      throw new BadRequestException('Only pending sessions can be cancelled');
    }

    const processor = this.getProcessor(session.processor);
    await processor.cancelSession(session);
    await this.sessionRepo.save(session);
  }
}
