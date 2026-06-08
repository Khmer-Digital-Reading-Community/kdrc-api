import { Injectable } from '@nestjs/common';
import { PaymentProcessor } from './payment-processor.interface';
import { PaymentSession } from '../payment-session.entity';
import { PaymentSessionStatus } from '../enums/payment-session-status.enum';

@Injectable()
export class ManualPaymentProcessor implements PaymentProcessor {
  readonly name = 'manual';

  async createSession(
    session: PaymentSession,
  ): Promise<{ processorSessionId?: string; qrCodeData?: string }> {
    const payload = {
      sessionId: session.id,
      amount: Number(session.amount),
      itemType: session.itemType,
      itemId: session.itemId,
    };
    const qrCodeData = Buffer.from(JSON.stringify(payload)).toString('base64');
    return { qrCodeData };
  }

  async checkStatus(session: PaymentSession): Promise<PaymentSessionStatus> {
    if (
      session.status === PaymentSessionStatus.PENDING &&
      new Date() > session.expiresAt
    ) {
      return PaymentSessionStatus.EXPIRED;
    }
    return session.status;
  }

  async confirmPayment(
    session: PaymentSession,
  ): Promise<{ confirmed: boolean }> {
    if (new Date() > session.expiresAt) {
      session.status = PaymentSessionStatus.EXPIRED;
      return { confirmed: false };
    }
    session.status = PaymentSessionStatus.CONFIRMED;
    return { confirmed: true };
  }

  async cancelSession(session: PaymentSession): Promise<void> {
    session.status = PaymentSessionStatus.CANCELLED;
  }
}
