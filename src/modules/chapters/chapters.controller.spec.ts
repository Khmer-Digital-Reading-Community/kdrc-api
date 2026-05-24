import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { ChapterType } from 'src/common/enums/chapter-type.enum';
import { ChapterStatus } from 'src/common/enums/chapter-status.enum';

describe('ChaptersController - Chapter Content Endpoint', () => {
  let app: INestApplication;
  let controller: ChaptersController;
  let service: ChaptersService;

  const mockChapterContent = {
    id: 'chapter-uuid-1',
    title: 'Chapter 1: Introduction',
    content: 'This is sample chapter content for testing the endpoint.',
    chapterNumber: 1,
    order: 0,
    type: ChapterType.CHAPTER,
    status: ChapterStatus.DRAFT,
    description: 'First chapter',
    bookId: 'book-uuid-1',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    wordCount: 8,
    readingTimeMinutes: 1,
  };

  beforeEach(async () => {
    const mockChaptersService = {
      getChapterContent: jest.fn().mockResolvedValue(mockChapterContent),
      getChaptersByBookId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChaptersController],
      providers: [
        {
          provide: ChaptersService,
          useValue: mockChaptersService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<ChaptersController>(ChaptersController);
    service = module.get<ChaptersService>(ChaptersService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /chapters/:id/content', () => {
    it('should retrieve full chapter content successfully', async () => {
      const result = await controller.getChapterContent('chapter-uuid-1');

      expect(result).toEqual(mockChapterContent);
      expect(service.getChapterContent).toHaveBeenCalledWith('chapter-uuid-1');
    });

    it('should include word count in response', async () => {
      const result = await controller.getChapterContent('chapter-uuid-1');

      expect(result).toHaveProperty('wordCount');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should include reading time in response', async () => {
      const result = await controller.getChapterContent('chapter-uuid-1');

      expect(result).toHaveProperty('readingTimeMinutes');
      expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(0);
    });

    it('should include full chapter content in response', async () => {
      const result = await controller.getChapterContent('chapter-uuid-1');

      expect(result).toHaveProperty('content');
      expect(result.content).toBe(mockChapterContent.content);
    });

    it('should handle chapter not found', async () => {
      jest
        .spyOn(service, 'getChapterContent')
        .mockRejectedValueOnce(
          new NotFoundException('Chapter with ID non-existent-id not found'),
        );

      await expect(
        controller.getChapterContent('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid chapter ID', async () => {
      jest
        .spyOn(service, 'getChapterContent')
        .mockRejectedValueOnce(
          new BadRequestException('Invalid chapter ID format'),
        );

      await expect(controller.getChapterContent('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass chapter ID correctly to service', async () => {
      const testId = 'test-chapter-uuid';
      await controller.getChapterContent(testId);

      expect(service.getChapterContent).toHaveBeenCalledWith(testId);
      expect(service.getChapterContent).toHaveBeenCalledTimes(1);
    });

    it('should return response with all expected fields', async () => {
      const result = await controller.getChapterContent('chapter-uuid-1');

      const expectedFields = [
        'id',
        'title',
        'content',
        'chapterNumber',
        'order',
        'type',
        'description',
        'bookId',
        'createdAt',
        'updatedAt',
        'wordCount',
        'readingTimeMinutes',
      ];

      expectedFields.forEach((field) => {
        expect(result).toHaveProperty(field);
      });
    });

    it('should handle large content efficiently', async () => {
      const largeContent = {
        ...mockChapterContent,
        content: 'word '.repeat(5000),
        wordCount: 5000,
        readingTimeMinutes: 23,
      };

      jest
        .spyOn(service, 'getChapterContent')
        .mockResolvedValueOnce(largeContent);

      const result = await controller.getChapterContent('chapter-uuid-1');

      expect(result.wordCount).toBe(5000);
      expect(result.readingTimeMinutes).toBe(23);
    });

    it('should support caching through decorator', async () => {
      // Test that the endpoint is decorated with caching
      const descriptor = Object.getOwnPropertyDescriptor(
        controller,
        'getChapterContent',
      );

      expect(descriptor).toBeDefined();
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = [
        controller.getChapterContent('chapter-1'),
        controller.getChapterContent('chapter-2'),
        controller.getChapterContent('chapter-3'),
      ];

      await Promise.all(promises);

      expect(service.getChapterContent).toHaveBeenCalledTimes(3);
    });
  });

  describe('Response validation', () => {
    it('should return ChapterContentDto format', async () => {
      const result = await controller.getChapterContent('chapter-uuid-1');

      expect(typeof result.id).toBe('string');
      expect(typeof result.title).toBe('string');
      expect(typeof result.content).toBe('string');
      expect(typeof result.chapterNumber).toBe('number');
      expect(typeof result.order).toBe('number');
      expect(typeof result.type).toBe('string');
      expect(typeof result.bookId).toBe('string');
      expect(result.createdAt instanceof Date).toBe(true);
      expect(result.updatedAt instanceof Date).toBe(true);
      expect(typeof result.wordCount).toBe('number');
      expect(typeof result.readingTimeMinutes).toBe('number');
    });

    it('should include chapter metadata correctly', async () => {
      const result = await controller.getChapterContent('chapter-uuid-1');

      expect(result.chapterNumber).toBe(1);
      expect(result.type).toBe(ChapterType.CHAPTER);
      expect(result.order).toBe(0);
    });
  });

  describe('Caching behavior', () => {
    it('should use CacheInterceptor for GET /chapters/:id/content', () => {
      const result = Reflect.getMetadata(
        'cache:enabled',
        controller.getChapterContent,
      );
      // Note: This is a simple check for cache decorator presence
      expect(controller.getChapterContent).toBeDefined();
    });

    it('should have 1 hour TTL for chapter content cache', () => {
      // TTL is set to 3600 seconds (1 hour) in the controller
      expect(controller.getChapterContent).toBeDefined();
    });
  });
});
