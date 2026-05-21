import { ChapterType } from 'src/common/enums/chapter-type.enum';

export class ChapterResponseDto {
  id!: string;
  title!: string;
  chapterNumber!: number;
  order!: number;
  type!: ChapterType;
  description?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
