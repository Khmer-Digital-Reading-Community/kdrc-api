import { Controller, Get, Query } from '@nestjs/common';
import { BooksService } from './books.service';
import { ExchangesService } from '../exchanges/exchanges.service';

@Controller('search')
export class SearchController {
    constructor(
        private booksService: BooksService,
        private exchangesService: ExchangesService,
    ) {}

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
        const suggestions = await this.booksService.getSearchSuggestions(q, parseInt(limit));

        // Also fetch matching exchange listings for the autocomplete
        let exchanges: Array<{ id: string; title: string; coverImage: string | null; author: { id: string; name: string } | null }> = [];
        if (q?.trim()) {
            try {
                const exchangeResults = await this.exchangesService.searchExchanges({
                    search: q.trim(),
                    limit: String(Math.min(parseInt(limit), 5)),
                });
                exchanges = (exchangeResults.data ?? []).map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    coverImage: e.imageUrl || null,
                    author: e.author ? { id: '', name: e.author } : null,
                }));
            } catch {
                // If exchange search fails, still return book suggestions
            }
        }

        return { ...suggestions, exchanges };
    }
}
