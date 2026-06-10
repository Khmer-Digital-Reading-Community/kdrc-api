import { IsEnum, IsOptional } from 'class-validator';
import { ExchangeListingStatus } from '../../../common/enums/exchange.enum';

export class AdminUpdateExchangeDto {
  @IsOptional()
  @IsEnum(ExchangeListingStatus)
  listingStatus?: ExchangeListingStatus;
}
