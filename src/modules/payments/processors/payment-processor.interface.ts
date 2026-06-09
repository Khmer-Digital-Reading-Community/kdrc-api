import { PaymentSession } from '../payment-session.entity';
import { PaymentSessionStatus } from '../enums/payment-session-status.enum';

export interface PaymentProcessor {
  readonly name: string;

  createSession(
    session: PaymentSession,
  ): Promise<{ processorSessionId?: string; qrCodeData?: string }>;

  checkStatus(session: PaymentSession): Promise<PaymentSessionStatus>;

  confirmPayment(session: PaymentSession): Promise<{ confirmed: boolean }>;

  cancelSession(session: PaymentSession): Promise<void>;
}
