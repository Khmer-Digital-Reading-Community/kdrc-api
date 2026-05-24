import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  MinLength,
  Min,
} from 'class-validator';
import { ChapterType } from 'src/common/enums/chapter-type.enum';
import { ChapterStatus } from 'src/common/enums/chapter-status.enum';

export class UpdateChapterDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  chapterNumber?: number;

  @IsEnum(ChapterType)
  @IsOptional()
  type?: ChapterType;

  @IsEnum(ChapterStatus)
  @IsOptional()
  status?: ChapterStatus;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
