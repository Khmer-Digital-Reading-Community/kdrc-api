import { IsArray, IsBoolean, IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BookStatus } from 'src/common/enums/book-status.enum';
import { CreateBookMetadataDto } from './create-book-metadata.dto';

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @IsOptional()
  @IsString()
  genreSlug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categorySlugs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagSlugs?: string[];

  @IsOptional()
  @IsString()
  tableOfContents?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPurchasable?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @Type(() => CreateBookMetadataDto)
  metadata?: CreateBookMetadataDto;
}
