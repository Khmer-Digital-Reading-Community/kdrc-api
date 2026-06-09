import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsNotEmpty({ message: 'Chapter ID is required' })
  chapterId!: string;

  @IsNumber()
  @IsNotEmpty()
  pageNumber!: number;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
