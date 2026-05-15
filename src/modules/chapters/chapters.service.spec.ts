import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChaptersService } from './chapters.service';
import { Chapter } from './chapter.entity';
import { Book } from '../books/book.entity';
import { ChapterType } from 'src/common/enums/chapter-type.enum';

describe('ChaptersService - Chapter Content', () => {
  let service: ChaptersService;
  let mockChaptersRepo: any;
  let mockBooksRepo: any;

  const mockChapter = {
    id: 'chapter-uuid-1',
    title: 'Chapter 1: Introduction',
    content:
      'This is a sample chapter content with multiple words to test word count calculation accurately. It contains various sentences and paragraphs.',
    chapterNumber: 1,
    order: 0,
    type: ChapterType.CHAPTER,
    description: 'First chapter',
    bookId: 'book-uuid-1',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    book: {
      id: 'book-uuid-1',
      title: 'Test Book',
    },
  };

  const mockEmptyContentChapter = {
    ...mockChapter,
    content: '',
  };

  const mockLargeContentChapter = {
    ...mockChapter,
    content: 'word '.repeat(5000), // 5000 words
  };

  beforeEach(async () => {
    mockChaptersRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockBooksRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChaptersService,
        {
          provide: getRepositoryToken(Chapter),
          useValue: mockChaptersRepo,
        },
        {
          provide: getRepositoryToken(Book),
          useValue: mockBooksRepo,
        },
      ],
    }).compile();

    service = module.get<ChaptersService>(ChaptersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChapterContent', () => {
    it('should retrieve full chapter content successfully', async () => {
      mockChaptersRepo.findOne.mockResolvedValue(mockChapter);

      const result = await service.getChapterContent('chapter-uuid-1');

      expect(result).toEqual({
        id: 'chapter-uuid-1',
        title: 'Chapter 1: Introduction',
        content: mockChapter.content,
        chapterNumber: 1,
        order: 0,
        type: ChapterType.CHAPTER,
        description: 'First chapter',
        bookId: 'book-uuid-1',
        createdAt: mockChapter.createdAt,
        updatedAt: mockChapter.updatedAt,
        wordCount: 26,
        readingTimeMinutes: 1,
      });
      expect(mockChaptersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'chapter-uuid-1' },
        relations: ['book'],
      });
    });

    it('should throw NotFoundException when chapter does not exist', async () => {
      mockChaptersRepo.findOne.mockResolvedValue(null);

      await expect(service.getChapterContent('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockChaptersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        relations: ['book'],
      });
    });

    it('should throw BadRequestException for invalid chapter ID', async () => {
      await expect(service.getChapterContent('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getChapterContent(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getChapterContent('   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty content chapter', async () => {
      mockChaptersRepo.findOne.mockResolvedValue(mockEmptyContentChapter);

      const result = await service.getChapterContent('chapter-uuid-1');

      expect(result.wordCount).toBe(0);
      expect(result.readingTimeMinutes).toBe(0);
    });

    it('should calculate correct word count', async () => {
      mockChaptersRepo.findOne.mockResolvedValue(mockChapter);

      const result = await service.getChapterContent('chapter-uuid-1');

      expect(typeof result.wordCount).toBe('number');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should calculate correct reading time in minutes', async () => {
      mockChaptersRepo.findOne.mockResolvedValue(mockChapter);

      const result = await service.getChapterContent('chapter-uuid-1');

      // Average reading speed: 225 words per minute
      const expectedReadingTime = Math.ceil(result.wordCount / 225);
      expect(result.readingTimeMinutes).toBe(expectedReadingTime);
    });

    it('should handle large chapter content efficiently', async () => {
      mockChaptersRepo.findOne.mockResolvedValue(mockLargeContentChapter);

      const result = await service.getChapterContent('chapter-uuid-1');

      expect(result.wordCount).toBe(5000);
      expect(result.readingTimeMinutes).toBe(23); // 5000/225 = 22.22, rounded up to 23
      expect(result.content).toBeDefined();
    });

    it('should include formatted chapter metadata', async () => {
      mockChaptersRepo.findOne.mockResolvedValue(mockChapter);

      const result = await service.getChapterContent('chapter-uuid-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('chapterNumber');
      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('bookId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('wordCount');
      expect(result).toHaveProperty('readingTimeMinutes');
    });

    it('should handle content with special characters and formatting', async () => {
      const specialContentChapter = {
        ...mockChapter,
        content:
          'Hello\nWorld\n\nMultiple   spaces\tand\ttabs\nand\r\nnewlines!!!',
      };
      mockChaptersRepo.findOne.mockResolvedValue(specialContentChapter);

      const result = await service.getChapterContent('chapter-uuid-1');

      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.wordCount).toBeLessThan(20);
    });

    it('should validate chapter ID is string and non-empty', async () => {
      await expect(service.getChapterContent(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getChapterContent(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getChapterContent(123 as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Word count calculation', () => {
    it('should handle null or undefined content', async () => {
      const chapterWithNullContent = {
        ...mockChapter,
        content: null,
      };
      mockChaptersRepo.findOne.mockResolvedValue(chapterWithNullContent);

      const result = await service.getChapterContent('chapter-uuid-1');
      expect(result.wordCount).toBe(0);
    });

    it('should handle whitespace-only content', async () => {
      const whitespacChapter = {
        ...mockChapter,
        content: '   \n\t\n   ',
      };
      mockChaptersRepo.findOne.mockResolvedValue(whitespacChapter);

      const result = await service.getChapterContent('chapter-uuid-1');
      expect(result.wordCount).toBe(0);
    });

    it('should count words separated by various whitespace characters', async () => {
      const mixedWhitespaceChapter = {
        ...mockChapter,
        content: 'word1   word2\nword3\tword4\r\nword5',
      };
      mockChaptersRepo.findOne.mockResolvedValue(mixedWhitespaceChapter);

      const result = await service.getChapterContent('chapter-uuid-1');
      expect(result.wordCount).toBe(5);
    });
  });

  describe('Reading time calculation', () => {
    it('should calculate reading time correctly (225 wpm average)', async () => {
      const testCases = [
        { words: 225, expectedMinutes: 1 },
        { words: 450, expectedMinutes: 2 },
        { words: 100, expectedMinutes: 1 }, // Rounds up
        { words: 1000, expectedMinutes: 5 },
        { words: 0, expectedMinutes: 0 },
      ];

      for (const testCase of testCases) {
        const chapter = {
          ...mockChapter,
          content: 'word '.repeat(testCase.words),
        };
        mockChaptersRepo.findOne.mockResolvedValue(chapter);

        const result = await service.getChapterContent('chapter-uuid-1');
        expect(result.readingTimeMinutes).toBe(testCase.expectedMinutes);
      }
    });
  });

  describe('Response format validation', () => {
    it('should return ChapterContentDto with all required fields', async () => {
      mockChaptersRepo.findOne.mockResolvedValue(mockChapter);

      const result = await service.getChapterContent('chapter-uuid-1');

      // Verify all required fields are present
      expect(result).toHaveProperty('id', expect.any(String));
      expect(result).toHaveProperty('title', expect.any(String));
      expect(result).toHaveProperty('content', expect.any(String));
      expect(result).toHaveProperty('chapterNumber', expect.any(Number));
      expect(result).toHaveProperty('order', expect.any(Number));
      expect(result).toHaveProperty('type', expect.any(String));
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('bookId', expect.any(String));
      expect(result).toHaveProperty('createdAt', expect.any(Date));
      expect(result).toHaveProperty('updatedAt', expect.any(Date));
      expect(result).toHaveProperty('wordCount', expect.any(Number));
      expect(result).toHaveProperty('readingTimeMinutes', expect.any(Number));
    });
  });
});
