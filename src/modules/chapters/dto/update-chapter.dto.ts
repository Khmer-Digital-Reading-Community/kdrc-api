import { IsString, IsNumber, IsEnum, IsOptional, MinLength, Min } from 'class-validator';
import { ChapterType } from 'src/common/enums/chapter-type.enum';

export class UpdateChapterDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  content?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  chapterNumber?: number;

  @IsEnum(ChapterType)
  @IsOptional()
  type?: ChapterType;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
