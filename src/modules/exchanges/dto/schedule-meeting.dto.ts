import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ScheduleMeetingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  meetingLocation!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  meetingTime!: string;
}
