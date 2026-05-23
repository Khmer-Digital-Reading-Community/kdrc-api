import { IsArray, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBookMetadataDto } from './create-book-metadata.dto';

export class CreateBookDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

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
  @Type(() => CreateBookMetadataDto)
  metadata?: CreateBookMetadataDto;
}
