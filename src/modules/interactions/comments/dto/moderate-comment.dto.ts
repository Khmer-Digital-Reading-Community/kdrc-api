import { IsOptional, IsString } from 'class-validator';

export class ModerateCommentDto {
  @IsOptional()
  @IsString()
  moderatorNotes?: string;
}
