import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from '../challenges/challenge.entity';
import { ReadingProgress } from '../reading-progress/reading-progress.entity';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, ReadingProgress])],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
