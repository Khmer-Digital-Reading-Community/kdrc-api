import { IsString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateChapterDto {
    @IsString()
    title!: string;

    @IsString()
    content!: string;

    @IsNumber()
    @Min(1)
    chapterNumber!: number;

    @IsUUID()
    bookId!: string;
}
