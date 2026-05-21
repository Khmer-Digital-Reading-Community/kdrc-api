import { ChapterType } from 'src/common/enums/chapter-type.enum';
import { ChapterStatus } from 'src/common/enums/chapter-status.enum';

/**
 * DTO for retrieving full chapter content
 * Includes the complete chapter information with full content text
 */
export class ChapterContentDto {
  id!: string;
  title!: string;
  content!: string;
  chapterNumber!: number;
  order!: number;
  type!: ChapterType;
  status!: ChapterStatus;
  description?: string;
  bookId!: string;
  createdAt!: Date;
  updatedAt!: Date;
  wordCount!: number;
  readingTimeMinutes!: number;
}
