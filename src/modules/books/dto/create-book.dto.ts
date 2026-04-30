import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateBookDto {
    @IsString()
    title!: string;

    @IsString()
    content!: string;

    @IsOptional()
    @IsArray()
    categorySlugs?: string[];
}