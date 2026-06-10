import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateExchangeRequestDto {
  @IsUUID()
  exchangeId!: string;

  @IsUUID()
  offeredExchangeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
