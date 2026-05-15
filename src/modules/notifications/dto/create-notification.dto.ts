import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationType } from '../notification.entity';

export class CreateNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsUUID()
  recipientId!: string;
}
