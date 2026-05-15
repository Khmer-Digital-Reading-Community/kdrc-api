import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { NotificationType } from '../notification.entity';

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsBoolean()
  @IsOptional()
  read?: boolean;
}
