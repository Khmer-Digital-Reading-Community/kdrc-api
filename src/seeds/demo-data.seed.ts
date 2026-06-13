import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { databaseConfig } from '../common/config/database.config';
import { User } from '../modules/users/user.entity';
import { Book } from '../modules/books/book.entity';
import { Follow } from '../modules/follows/follow.entity';
import { Review } from '../modules/reviews/review.entity';
import { ReadingProgress } from '../modules/reading-progress/reading-progress.entity';
import { BookStatus } from '../common/enums/book-status.enum';

async function seed() {
  const dataSource = new DataSource(databaseConfig as any);
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const bookRepo = dataSource.getRepository(Book);
  const followRepo = dataSource.getRepository(Follow);
  const reviewRepo = dataSource.getRepository(Review);

  // Find target user
  const author = await userRepo.findOne({ where: { email: 'bleh@gmail.com' } });
  if (!author) {
    console.error('User bleh@gmail.com not found.');
    await dataSource.destroy();
    process.exit(1);
  }
  console.log(`Found user: ${author.email}`);

  // Update or create published book
  let book = await bookRepo.findOne({
    where: { author: { id: author.id }, status: BookStatus.PUBLISHED },
  });

  if (book) {
    await bookRepo.update(book.id, { readCount: 4280, rating: 4.4 });
    console.log(`Updated book: "${book.title}"`);
  } else {
    book = await bookRepo.save(bookRepo.create({
      title: 'The Secret of Angkor',
      description: 'A thrilling journey through the ancient temples of Cambodia.',
      status: BookStatus.PUBLISHED,
      author,
      isFree: false,
      isPremium: true,
      readCount: 4280,
      rating: 4.4,
    }));
    console.log(`Created book: "${book.title}"`);
  }

  // Create second book
  const secondBook = await bookRepo.findOne({
    where: { author: { id: author.id }, title: 'Moon Over Tonle Sap' },
  });
  if (!secondBook) {
    await bookRepo.save(bookRepo.create({
      title: 'Moon Over Tonle Sap',
      description: 'A poetic tale of love and loss set along the shores of Cambodia\'s great lake.',
      status: BookStatus.PUBLISHED,
      author,
      isFree: true,
      isPremium: false,
      readCount: 2150,
      rating: 4.1,
    }));
    console.log('Created second book: "Moon Over Tonle Sap"');
  } else {
    await bookRepo.update(secondBook.id, { readCount: 2150, rating: 4.1 });
    console.log('Updated second book.');
  }

  // Bulk insert dummy users + follows
  const existingFollows = await followRepo.count({ where: { followingId: author.id } });
  const followersNeeded = Math.max(0, 350 - existingFollows);

  if (followersNeeded > 0) {
    console.log(`Adding ${followersNeeded} followers in bulk...`);
    const ts = Date.now();

    // Bulk insert users
    const dummyUsers = Array.from({ length: followersNeeded }, (_, i) => ({
      email: `follower_${ts}_${i}@demo.kdrc`,
      name: `Reader ${i + 1}`,
      password: 'demo_hashed_password',
    }));
    const inserted = await dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(dummyUsers)
      .returning('id')
      .execute();

    const ids = inserted.raw.map((r: any) => r.id);

    // Bulk insert follows
    const follows = ids.map((id: string) => ({
      followerId: id,
      followingId: author.id,
    }));
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(Follow)
      .values(follows)
      .execute();

    console.log(`Added ${followersNeeded} followers.`);
  } else {
    console.log(`Already has ${existingFollows} followers, skipping.`);
  }

  // Bulk insert reviews
  const existingReviews = await reviewRepo.count({ where: { bookId: book.id } });
  if (existingReviews < 5) {
    const ts2 = Date.now();
    const reviewUsers = await dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        { email: `rev_${ts2}_1@demo.kdrc`, name: 'Reviewer 1', password: 'x' },
        { email: `rev_${ts2}_2@demo.kdrc`, name: 'Reviewer 2', password: 'x' },
        { email: `rev_${ts2}_3@demo.kdrc`, name: 'Reviewer 3', password: 'x' },
        { email: `rev_${ts2}_4@demo.kdrc`, name: 'Reviewer 4', password: 'x' },
        { email: `rev_${ts2}_5@demo.kdrc`, name: 'Reviewer 5', password: 'x' },
      ])
      .returning('id')
      .execute();

    const reviewerIds = reviewUsers.raw.map((r: any) => r.id);
    const ratings = [4.5, 4.0, 5.0, 4.0, 4.5];

    await dataSource
      .createQueryBuilder()
      .insert()
      .into(Review)
      .values(ratings.map((rating, i) => ({
        rating,
        comment: 'Great book!',
        reviewerId: reviewerIds[i],
        bookId: book.id,
      })))
      .execute();

    console.log('Added 5 reviews.');
  } else {
    console.log('Reviews already exist, skipping.');
  }

  // Add reading progress entries spread across the last 7 days
  const progressRepo = dataSource.getRepository(ReadingProgress);
  const existingProgress = await progressRepo.count({ where: { book: { id: book.id } } });

  if (existingProgress < 7) {
    console.log('Adding reading progress for last 7 days...');
    const readerIds = (await followRepo.find({
      where: { followingId: author.id },
      take: 70,
    })).map(f => f.followerId);

    const readersPerDay = [12, 18, 9, 25, 20, 30, 27];
    const progressEntries: any[] = [];

    for (let day = 6; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(10, 0, 0, 0);

      const count = readersPerDay[6 - day];
      const slice = readerIds.slice(day * 10, day * 10 + count);

      for (const userId of slice) {
        progressEntries.push({
          userId,
          bookId: book.id,
          percentageCompleted: Math.floor(Math.random() * 80) + 10,
          lastReadAt: date,
        });
      }
    }

    if (progressEntries.length > 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(ReadingProgress)
        .values(progressEntries)
        .orIgnore()
        .execute();
      console.log(`Added ${progressEntries.length} reading progress entries.`);
    }
  } else {
    console.log('Reading progress already exists, skipping.');
  }

  console.log('Done!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
