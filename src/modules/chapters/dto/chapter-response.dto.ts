import { ChapterType } from 'src/common/enums/chapter-type.enum';
import { ChapterStatus } from 'src/common/enums/chapter-status.enum';

export class ChapterResponseDto {
  id!: string;
  title!: string;
  chapterNumber!: number;
  order!: number;
  type!: ChapterType;
  status!: ChapterStatus;
  description?: string;
  wordCount!: number;
  price!: number;
  isPurchasable!: boolean;
  isPremium!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
