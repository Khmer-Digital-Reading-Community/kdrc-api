import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Book } from '../books/book.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepo: Repository<Review>,

    @InjectRepository(Book)
    private booksRepo: Repository<Book>,

    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(createReviewDto: CreateReviewDto, user: any) {
    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if book exists
    const book = await this.booksRepo.findOne({
      where: { id: createReviewDto.bookId },
    });

    if (!book) {
      throw new NotFoundException(
        `Book with ID ${createReviewDto.bookId} not found`,
      );
    }

    // Check if user already reviewed this book
    const existingReview = await this.reviewsRepo.findOne({
      where: { reviewerId: user.id, bookId: createReviewDto.bookId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this book');
    }

    const review = this.reviewsRepo.create({
      ...createReviewDto,
      reviewer: { id: user.id },
      book: { id: createReviewDto.bookId },
    });

    return this.reviewsRepo.save(review);
  }

  async findAll() {
    return this.reviewsRepo.find({
      relations: ['reviewer', 'book'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const review = await this.reviewsRepo.findOne({
      where: { id },
      relations: ['reviewer', 'book'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByBook(bookId: string) {
    const book = await this.booksRepo.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    return this.reviewsRepo.find({
      where: { bookId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.reviewsRepo.find({
      where: { reviewerId: userId },
      relations: ['book'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, user: any) {
    const review = await this.findOne(id);

    if (review.reviewerId !== user.id) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, updateReviewDto);
    return this.reviewsRepo.save(review);
  }

  async remove(id: string, user: any) {
    const review = await this.findOne(id);

    if (review.reviewerId !== user.id) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    return this.reviewsRepo.remove(review);
  }

  async getAverageRating(bookId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const book = await this.booksRepo.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    const reviews = await this.reviewsRepo.find({
      where: { bookId },
    });

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const averageRating =
      reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
      reviews.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    };
  }

  async getReviewStats(bookId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const book = await this.booksRepo.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    const reviews = await this.reviewsRepo.find({
      where: { bookId },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      const rating = Math.round(Number(review.rating));
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
        totalRating += Number(review.rating);
      }
    });

    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }
}
