import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BookCondition, ExchangeType } from '../../../common/enums/';

export class CreateExchangeDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @IsEnum(BookCondition, { message: 'Invalid book condition' })
  condition!: BookCondition;

  @IsEnum(ExchangeType, { message: 'Invalid exchange type' })
  exchangeType!: ExchangeType;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  price?: number;
}
