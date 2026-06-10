import { IsEnum, IsNotEmpty } from 'class-validator';

export enum LikeTargetType {
  BOOK = 'BOOK',
  CHAPTER = 'CHAPTER',
  COMMENT = 'COMMENT',
}

export class ToggleLikeDto {
  @IsEnum(LikeTargetType)
  @IsNotEmpty()
  targetId!: string;

  @IsNotEmpty()
  targetType!: LikeTargetType;
}
