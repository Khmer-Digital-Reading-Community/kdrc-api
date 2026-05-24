import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  slug!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
