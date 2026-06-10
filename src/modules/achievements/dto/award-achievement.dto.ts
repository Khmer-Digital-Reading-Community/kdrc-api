import { IsUUID } from 'class-validator';

export class AwardAchievementDto {
  @IsUUID()
  userId!: string;
}
