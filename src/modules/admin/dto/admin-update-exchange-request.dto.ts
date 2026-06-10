import { IsEnum } from 'class-validator';
import { ExchangeRequestStatus } from '../../../common/enums/exchange.enum';

export class AdminUpdateExchangeRequestDto {
  @IsEnum(ExchangeRequestStatus)
  status!: ExchangeRequestStatus;
}
