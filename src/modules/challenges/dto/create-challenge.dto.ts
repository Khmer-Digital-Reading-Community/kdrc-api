import { IsString, IsInt, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(1)
  targetBooks!: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsString()
  color!: string;

  @IsString()
  icon!: string;
}
