import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class SubscribeDto {
  @IsUUID()
  planId!: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
