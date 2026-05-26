import { IsString, IsOptional, IsNumber, IsDate, IsArray, IsEnum } from 'class-validator';
import { AgeRating } from '../entities/book-metadata.entity';
import { Type } from 'class-transformer';

export class CreateBookMetadataDto {
  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  authorBio?: string;

  @IsString()
  @IsOptional()
  publisher?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  publishedDate?: Date;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pageCount?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsEnum(AgeRating)
  @IsOptional()
  ageRating?: AgeRating;

  @IsArray()
  @IsOptional()
  contentWarnings?: string[];

  @IsString()
  @IsOptional()
  seriesName?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  seriesPosition?: number;
}
