import { IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { BookmarkType } from '../bookmark.entity';

export class CreateBookmarkDto {
  @IsNotEmpty({ message: 'Bookmark type is required.' })
  @IsEnum(BookmarkType, { message: 'Type must be either BOOK or CHAPTER.' })
  type: BookmarkType;

  @IsNotEmpty({ message: 'Target ID is required.' })
  @IsUUID('all', { message: 'Target ID must be a valid UUID.' })
  targetId: string;
}