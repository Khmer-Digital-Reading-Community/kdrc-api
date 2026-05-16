import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ReadingProgressService } from './reading-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reading-progress')
export class ReadingProgressController {
    constructor(private service: ReadingProgressService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Req() req) {
        return this.service.findByUser(req.user.id);
    }
}
