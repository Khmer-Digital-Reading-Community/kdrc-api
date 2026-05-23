import { IsString, IsNumber, IsEnum, IsOptional, MinLength, Min } from 'class-validator';
import { ChapterType } from 'src/common/enums/chapter-type.enum';

export class CreateChapterDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsNumber()
  @Min(1)
  chapterNumber!: number;

  @IsEnum(ChapterType)
  @IsOptional()
  type?: ChapterType;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  bookId!: string;
}
