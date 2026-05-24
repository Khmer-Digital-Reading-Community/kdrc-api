import { IsUUID, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class UpsertProgressDto {
  @IsUUID()
  bookId!: string;

  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentageCompleted!: number;
}
