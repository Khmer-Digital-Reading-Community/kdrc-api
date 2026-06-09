import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentSession } from './payment-session.entity';
import { Book } from '../books/book.entity';
import { Chapter } from '../chapters/entities/chapter.entity';
import { PaymentSessionsService } from './payment-sessions.service';
import { PaymentSessionsController } from './payment-sessions.controller';
import { ManualPaymentProcessor } from './processors/manual-payment.processor';
import { StripePaymentProcessor } from './processors/stripe-payment.processor';
import { PurchasesModule } from '../purchases/purchases.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentSession, Book, Chapter]),
    PurchasesModule,
  ],
  controllers: [PaymentSessionsController],
  providers: [
    PaymentSessionsService,
    ManualPaymentProcessor,
    StripePaymentProcessor,
  ],
  exports: [PaymentSessionsService],
})
export class PaymentsModule {}
