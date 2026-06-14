import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsOptional()
  chapterId?: string;

  @IsNumber()
  @IsOptional()
  pageNumber?: number;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
