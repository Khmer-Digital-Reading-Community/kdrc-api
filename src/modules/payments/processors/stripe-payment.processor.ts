import { Injectable, NotImplementedException } from '@nestjs/common';
import { PaymentProcessor } from './payment-processor.interface';
import { PaymentSession } from '../payment-session.entity';
import { PaymentSessionStatus } from '../enums/payment-session-status.enum';

@Injectable()
export class StripePaymentProcessor implements PaymentProcessor {
  readonly name = 'stripe';

  async createSession(_session: PaymentSession): Promise<{ processorSessionId?: string; qrCodeData?: string }> {
    throw new NotImplementedException('Stripe payment processor is not yet implemented');
  }

  async checkStatus(_session: PaymentSession): Promise<PaymentSessionStatus> {
    throw new NotImplementedException('Stripe payment processor is not yet implemented');
  }

  async confirmPayment(_session: PaymentSession): Promise<{ confirmed: boolean }> {
    throw new NotImplementedException('Stripe payment processor is not yet implemented');
  }

  async cancelSession(_session: PaymentSession): Promise<void> {
    throw new NotImplementedException('Stripe payment processor is not yet implemented');
  }
}
