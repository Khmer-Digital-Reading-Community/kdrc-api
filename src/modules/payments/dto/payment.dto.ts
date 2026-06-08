import { IsEnum, IsUUID } from 'class-validator';
import { PaymentItemType } from '../enums/payment-item-type.enum';

export class InitiatePaymentDto {
  @IsEnum(PaymentItemType)
  itemType!: PaymentItemType;

  @IsUUID()
  itemId!: string;
}

export interface PaymentSessionResponse {
  id: string;
  itemType: PaymentItemType;
  itemId: string;
  amount: number;
  status: string;
  expiresAt: Date;
  qrCodeData: string;
}
