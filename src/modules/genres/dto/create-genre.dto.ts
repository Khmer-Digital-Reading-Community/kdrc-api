import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  slug!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateGenreDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
