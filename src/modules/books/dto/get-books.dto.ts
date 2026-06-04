import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
export class GetBooksDto {
  @IsOptional()
  @Type(() => Number) // Converts the URL string to a number
  @IsInt()
  @Min(1)
  page?: number = 1; // Default to page 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10; // Default to 10 books per page

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'; // Default to sorting by creation date

  @IsOptional()
  @IsString()
  sortOrder?: SortOrder = SortOrder.DESC;
}
