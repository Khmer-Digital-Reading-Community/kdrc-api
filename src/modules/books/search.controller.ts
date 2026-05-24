import { Controller, Get, Query } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('search')
export class SearchController {
    constructor(private booksService: BooksService) {}

    /**
     * Get search suggestions for autocomplete
     * @param q - Search query
     * @param limit - Maximum number of suggestions per category
     */
    @Get('suggestions')
    async getSuggestions(
        @Query('q') q: string,
        @Query('limit') limit: string = '10',
    ) {
        return this.booksService.getSearchSuggestions(q, parseInt(limit));
    }
}
