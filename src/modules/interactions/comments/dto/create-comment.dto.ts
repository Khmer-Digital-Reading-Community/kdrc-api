import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsNotEmpty()
  bookId!: string;

  @IsNumber()
  @IsNotEmpty()
  pageNumber!: number;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
