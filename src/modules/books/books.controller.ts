import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Delete, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('books')
export class BooksController {
    constructor(private booksService: BooksService) { }

    @Get()
    findAll() {
        return this.booksService.findAll();
    }

    @Get('search')
    search(
        @Query('q') q: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.booksService.search(
            q,
            Number(page),
            Number(limit),
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.booksService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateBookDto, @Req() req) {
        return this.booksService.create(dto, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateBookDto,
        @Req() req,
    ) {
        return this.booksService.update(id, dto, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {
        return this.booksService.remove(id, req.user);
    }
}