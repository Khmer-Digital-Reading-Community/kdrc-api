import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @MinLength(1)
  type!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsUUID()
  reportedUserId?: string;
}
