import { IsString } from 'class-validator';

export class CreateAchievementDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  icon!: string;

  @IsString()
  color!: string;

  @IsString()
  category!: string;
}
