import { MigrationInterface, QueryRunner } from 'typeorm';

const ids = {
  users: {
    admin: '11111111-1111-4111-8111-111111111111',
    author: '22222222-2222-4222-8222-222222222222',
    reader: '33333333-3333-4333-8333-333333333333',
  },
  books: {
    atlas: '44444444-4444-4444-8444-444444444444',
    ember: '55555555-5555-4555-8555-555555555555',
  },
  chapters: {
    atlasPrologue: '66666666-6666-4666-8666-666666666666',
    atlasOne: '77777777-7777-4777-8777-777777777777',
    atlasTwo: '88888888-8888-4888-8888-888888888888',
    emberOne: '99999999-9999-4999-8999-999999999999',
  },
  metadata: {
    atlas: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    ember: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  },
  tags: {
    fantasy: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    adventure: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    bestseller: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  },
  achievements: {
    firstReview: 'f1111111-1111-4111-8111-111111111111',
    streakReader: 'f2222222-2222-4222-8222-222222222222',
  },
  challenges: {
    spring: 'f3333333-3333-4333-8333-333333333333',
    marathon: 'f4444444-4444-4444-8444-444444444444',
  },
  reviews: {
    atlas: 'f5555555-5555-4555-8555-555555555555',
    ember: 'f6666666-6666-4666-8666-666666666666',
  },
  notifications: {
    welcome: 'f7777777-7777-4777-8777-777777777777',
    reminder: 'f8888888-8888-4888-8888-888888888888',
  },
  bookmarks: {
    atlas: 'f9999999-9999-4999-8999-999999999999',
    chapter: 'fa111111-1111-4111-8111-111111111111',
  },
  userChallenges: {
    reader: 'fb222222-2222-4222-8222-222222222222',
    admin: 'fc333333-3333-4333-8333-333333333333',
  },
  userAchievements: {
    reader: 'fd444444-4444-4444-8444-444444444444',
    admin: 'fe555555-5555-4555-8555-555555555555',
  },
  progress: {
    atlas: 'ff666666-6666-4666-8666-666666666666',
    ember: 'ff777777-7777-4777-8777-777777777777',
  },
  comments: {
    atlas: 'ff888888-8888-4888-8888-888888888888',
    ember: 'ff999999-9999-4999-8999-999999999999',
  },
};

export class SeedSampleData20260524000000 implements MigrationInterface {
  name = 'SeedSampleData20260524000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO users (id, email, name, password, role, provider, "providerId", "refreshToken", "createdAt", "updatedAt")
      VALUES
        ('${ids.users.admin}', 'admin@tosan.local', 'System Admin', '$2b$10$wH4m9u8R1YJQ0P8Q0wz2Qe8pY5j2cXw6F3mQmL4Lh4r1g8b8N5j4xS', 'ADMIN', NULL, NULL, NULL, NOW(), NOW()),
        ('${ids.users.author}', 'author@tosan.local', 'Mina Harper', '$2b$10$wH4m9u8R1YJQ0P8Q0wz2Qe8pY5j2cXw6F3mQmL4Lh4r1g8b8N5j4xS', 'WRITER', NULL, NULL, NULL, NOW(), NOW()),
        ('${ids.users.reader}', 'reader@tosan.local', 'Omar Reed', '$2b$10$wH4m9u8R1YJQ0P8Q0wz2Qe8pY5j2cXw6F3mQmL4Lh4r1g8b8N5j4xS', 'READER', NULL, NULL, NULL, NOW(), NOW())
      ON CONFLICT DO NOTHING;

      DELETE FROM book_categories_category WHERE "categoryId" IN (1, 2, 3);
      DELETE FROM category WHERE id IN (1, 2, 3) OR slug IN ('fiction', 'adventure', 'science-fiction');

      INSERT INTO category (id, slug, name)
      VALUES
        (1, 'fiction', 'Fiction'),
        (2, 'adventure', 'Adventure'),
        (3, 'science-fiction', 'Science Fiction')
      ON CONFLICT DO NOTHING;

      INSERT INTO genres (id, name, slug, description, "createdAt", "updatedAt")
      VALUES
        (1, 'Epic Fantasy', 'epic-fantasy', 'Large-scale fantasy stories with layered world-building.', NOW(), NOW()),
        (2, 'Space Opera', 'space-opera', 'High-stakes adventures set across planets and systems.', NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO tags (id, name, slug, description, "createdAt", "updatedAt")
      VALUES
        ('${ids.tags.fantasy}', 'Fantasy', 'fantasy', 'Stories with magical or mythic elements.', NOW(), NOW()),
        ('${ids.tags.adventure}', 'Adventure', 'adventure', 'Fast-moving plots with exploration and risk.', NOW(), NOW()),
        ('${ids.tags.bestseller}', 'Bestseller', 'bestseller', 'Featured as one of the sample catalog highlights.', NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;

      INSERT INTO achievements (id, name, description, icon, color, category, "createdAt", "updatedAt")
      VALUES
        ('${ids.achievements.firstReview}', 'First Review', 'Awarded after posting the first review.', '⭐', '#f59e0b', 'engagement', NOW(), NOW()),
        ('${ids.achievements.streakReader}', 'Streak Reader', 'Granted for reading on multiple consecutive days.', '🔥', '#ef4444', 'reading', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO challenges (id, title, description, "targetBooks", deadline, color, icon, "createdAt", "updatedAt")
      VALUES
        ('${ids.challenges.spring}', 'Spring Reading Sprint', 'Read two books before the season ends.', 2, '2026-08-31', '#22c55e', '🌱', NOW(), NOW()),
        ('${ids.challenges.marathon}', 'Chapter Marathon', 'Complete at least five chapters in a week.', 5, '2026-09-30', '#3b82f6', '📚', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO book (id, title, description, "coverImageUrl", status, rating, "readCount", "likeCount", "tableOfContents", "authorId", "genreId", "createdAt", "updatedAt")
      VALUES
        ('${ids.books.atlas}', 'Atlas of the Ember Coast', 'A cartographer discovers a hidden coastline that redraws the borders of an entire kingdom.', 'https://images.example.com/books/atlas.jpg', 'PUBLISHED', 4.8, 1280, 412, 'Prologue\nChapter 1\nChapter 2\nChapter 3', '${ids.users.author}', 1, NOW(), NOW()),
        ('${ids.books.ember}', 'Signals Beyond the Dunes', 'A field engineer follows a repeating signal across a desert moon and finds an abandoned relay station.', 'https://images.example.com/books/ember.jpg', 'PUBLISHED', 4.5, 860, 275, 'Chapter 1\nChapter 2\nEpilogue', '${ids.users.author}', 2, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO book_categories_category ("bookId", "categoryId")
      VALUES
        ('${ids.books.atlas}', 1),
        ('${ids.books.atlas}', 2),
        ('${ids.books.ember}', 3)
      ON CONFLICT DO NOTHING;

      INSERT INTO book_metadata (id, "bookId", subtitle, "authorBio", publisher, "publishedDate", "pageCount", language, "ageRating", "contentWarnings", "seriesName", "seriesPosition", "estimatedReadingTime", "createdAt", "updatedAt")
      VALUES
        ('${ids.metadata.atlas}', '${ids.books.atlas}', 'A cartographer''s search for the coastline that should not exist.', 'Mina Harper writes adventure-driven fantasy with maps, mysteries, and layered mythology.', 'TosAn Press', '2026-01-12', 412, 'English', 'PG-13', 'mild peril, storm scenes', 'Coastal Archives', 1, 6, NOW(), NOW()),
        ('${ids.metadata.ember}', '${ids.books.ember}', 'A lone engineer follows a signal across a desert moon.', 'Mina Harper blends speculative science fiction with cinematic pacing.', 'TosAn Press', '2026-03-08', 286, 'English', 'PG', 'isolation, resource scarcity', 'Moon Relay Files', 1, 2, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO chapters (id, title, content, "chapterNumber", type, status, "order", description, "contentType", "bookId", "wordCount", "createdAt", "updatedAt")
      VALUES
        ('${ids.chapters.atlasPrologue}', 'Prologue: The Coast That Moved', 'The map was already wrong before the boat left the harbor, but no one noticed until the tide turned and the coastline began to move.', 0, 'PROLOGUE', 'PUBLISHED', 0, 'A warning before the journey begins.', 'text', '${ids.books.atlas}', 25, NOW(), NOW()),
        ('${ids.chapters.atlasOne}', 'Chapter 1: The Ink Road', 'Mina followed the salt-stained markers through the old lighthouse district, comparing them against the atlas that seemed to rewrite itself each night.', 1, 'CHAPTER', 'PUBLISHED', 1, 'The first route into the coastal archive.', 'text', '${ids.books.atlas}', 20, NOW(), NOW()),
        ('${ids.chapters.atlasTwo}', 'Chapter 2: Ruins Beneath the Tide', 'By dusk the hidden bay had revealed a second set of ruins, and the symbols carved into the stone matched the notes from her missing mentor.', 2, 'CHAPTER', 'PUBLISHED', 2, 'A discovery in the submerged district.', 'text', '${ids.books.atlas}', 24, NOW(), NOW()),
        ('${ids.chapters.emberOne}', 'Chapter 1: The Signal in the Sand', 'The relay tower on the moon hummed with a pattern that no one had heard in decades, and every repetition pointed deeper into the dunes.', 1, 'CHAPTER', 'PUBLISHED', 1, 'The first transmission from the moon relay.', 'text', '${ids.books.ember}', 23, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO reviews (id, rating, comment, "reviewerId", "bookId", "createdAt", "updatedAt")
      VALUES
        ('${ids.reviews.atlas}', 4.9, 'Beautiful pacing and a strong sense of place from the first page.', '${ids.users.reader}', '${ids.books.atlas}', NOW(), NOW()),
        ('${ids.reviews.ember}', 4.4, 'The central mystery builds steadily and pays off in the final scenes.', '${ids.users.reader}', '${ids.books.ember}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO notifications (id, title, message, type, read, "recipientId", "createdAt", "updatedAt")
      VALUES
        ('${ids.notifications.welcome}', 'Welcome to TosAn', 'Your sample account is ready for browsing, bookmarking, and reviewing.', 'success', false, '${ids.users.reader}', NOW(), NOW()),
        ('${ids.notifications.reminder}', 'Reading streak reminder', 'You are one chapter away from extending your reading streak today.', 'info', true, '${ids.users.reader}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO bookmarks (id, "userId", "bookId", "createdAt", "updatedAt")
      VALUES
        ('${ids.bookmarks.atlas}', '${ids.users.reader}', '${ids.books.atlas}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO user_challenges (id, "userId", "challengeId", "completedBooks", "joinedAt", "completedAt", "createdAt", "updatedAt")
      VALUES
        ('${ids.userChallenges.reader}', '${ids.users.reader}', '${ids.challenges.spring}', 1, '2026-05-01T10:00:00.000Z', NULL, NOW(), NOW()),
        ('${ids.userChallenges.admin}', '${ids.users.admin}', '${ids.challenges.marathon}', 5, '2026-05-03T10:00:00.000Z', '2026-05-10T18:30:00.000Z', NOW(), NOW())
      ON CONFLICT ("userId", "challengeId") DO NOTHING;

      INSERT INTO user_achievements (id, "userId", "achievementId", "earnedAt", "createdAt", "updatedAt")
      VALUES
        ('${ids.userAchievements.reader}', '${ids.users.reader}', '${ids.achievements.firstReview}', '2026-05-05T12:00:00.000Z', NOW(), NOW()),
        ('${ids.userAchievements.admin}', '${ids.users.admin}', '${ids.achievements.streakReader}', '2026-05-06T12:00:00.000Z', NOW(), NOW())
      ON CONFLICT ("userId", "achievementId") DO NOTHING;

      INSERT INTO reading_progress (id, "userId", "bookId", "chapterId", "percentageCompleted", "lastReadAt", "createdAt", "updatedAt")
      VALUES
        ('${ids.progress.atlas}', '${ids.users.reader}', '${ids.books.atlas}', '${ids.chapters.atlasOne}', 72.5, '2026-05-14T10:30:00.000Z', NOW(), NOW()),
        ('${ids.progress.ember}', '${ids.users.reader}', '${ids.books.ember}', '${ids.chapters.emberOne}', 31.25, '2026-05-16T16:15:00.000Z', NOW(), NOW())
      ON CONFLICT ("userId", "bookId") DO NOTHING;

      INSERT INTO comments (id, content, "pageNumber", "userId", "chapterId", "createdAt", "updatedAt")
      VALUES
        ('${ids.comments.atlas}', 'The transition into the lighthouse district is the strongest setup in the chapter.', 12, '${ids.users.reader}', '${ids.chapters.atlasOne}', NOW(), NOW()),
        ('${ids.comments.ember}', 'The signal motif ties the chapter together nicely and keeps the tension high.', 6, '${ids.users.reader}', '${ids.chapters.emberOne}', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM comments WHERE id IN ('${ids.comments.atlas}', '${ids.comments.ember}');
      DELETE FROM reading_progress WHERE id IN ('${ids.progress.atlas}', '${ids.progress.ember}');
      DELETE FROM user_achievements WHERE id IN ('${ids.userAchievements.reader}', '${ids.userAchievements.admin}');
      DELETE FROM user_challenges WHERE id IN ('${ids.userChallenges.reader}', '${ids.userChallenges.admin}');
      DELETE FROM bookmarks WHERE id IN ('${ids.bookmarks.atlas}');
      DELETE FROM notifications WHERE id IN ('${ids.notifications.welcome}', '${ids.notifications.reminder}');
      DELETE FROM reviews WHERE id IN ('${ids.reviews.atlas}', '${ids.reviews.ember}');
      DELETE FROM book_metadata WHERE id IN ('${ids.metadata.atlas}', '${ids.metadata.ember}');
      DELETE FROM chapters WHERE id IN ('${ids.chapters.atlasPrologue}', '${ids.chapters.atlasOne}', '${ids.chapters.atlasTwo}', '${ids.chapters.emberOne}');
      DELETE FROM book_categories_category WHERE "bookId" IN ('${ids.books.atlas}', '${ids.books.ember}');
      DELETE FROM book WHERE id IN ('${ids.books.atlas}', '${ids.books.ember}');
      DELETE FROM challenges WHERE id IN ('${ids.challenges.spring}', '${ids.challenges.marathon}');
      DELETE FROM achievements WHERE id IN ('${ids.achievements.firstReview}', '${ids.achievements.streakReader}');
      DELETE FROM tags WHERE id IN ('${ids.tags.fantasy}', '${ids.tags.adventure}', '${ids.tags.bestseller}');
      DELETE FROM category WHERE id IN (1, 2, 3);
      DELETE FROM genres WHERE id IN (1, 2);
      DELETE FROM users WHERE id IN ('${ids.users.admin}', '${ids.users.author}', '${ids.users.reader}');
    `);
  }
}
