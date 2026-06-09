import { IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class AddBookToListDto {
  @IsUUID()
  bookId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}
