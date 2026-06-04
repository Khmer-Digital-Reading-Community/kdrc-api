import { IsUUID, IsNumber, Min, Max } from 'class-validator';

export class UpsertChapterScrollDto {
  @IsUUID()
  bookId!: string;

  @IsUUID()
  chapterId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  scrollPercentage!: number;
}
