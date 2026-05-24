import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingProgress } from './reading-progress.entity';
import { ReadingProgressService } from './reading-progress.service';
import { ReadingProgressController } from './reading-progress.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ReadingProgress])],
    controllers: [ReadingProgressController],
    providers: [ReadingProgressService],
})
export class ReadingProgressModule {}
