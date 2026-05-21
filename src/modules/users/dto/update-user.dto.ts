import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(['km', 'en'])
  @IsOptional()
  languagePreference?: string;
}
