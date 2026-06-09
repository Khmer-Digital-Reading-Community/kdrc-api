import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('book/:bookId')
  buyBook(@Req() req, @Param('bookId') bookId: string) {
    return this.purchasesService.buyBook(req.user.id, bookId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('chapter/:chapterId')
  buyChapter(@Req() req, @Param('chapterId') chapterId: string) {
    return this.purchasesService.buyChapter(req.user.id, chapterId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check/book/:bookId')
  checkBookOwnership(@Req() req, @Param('bookId') bookId: string) {
    return this.purchasesService.checkBookOwnership(req.user.id, bookId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check/chapter/:chapterId')
  checkChapterOwnership(@Req() req, @Param('chapterId') chapterId: string) {
    return this.purchasesService.checkChapterOwnership(
      req.user.id,
      chapterId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyPurchases(@Req() req) {
    return this.purchasesService.getUserPurchases(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('library')
  getMyLibrary(@Req() req) {
    return this.purchasesService.getUserLibrary(req.user.id);
  }
}
