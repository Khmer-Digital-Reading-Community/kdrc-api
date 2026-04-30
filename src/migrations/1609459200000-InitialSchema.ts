import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class InitialSchema1609459200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'username',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'full_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['ADMIN', 'AUTHOR', 'READER', 'MODERATOR'],
            default: `'READER'`,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'provider_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Genres table
    await queryRunner.createTable(
      new Table({
        name: 'genres',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name_en',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Books table
    await queryRunner.createTable(
      new Table({
        name: 'books',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'slug',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cover_image_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'language',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'total_rating',
            type: 'float',
            default: 0,
          },
          {
            name: 'is_premium',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_published',
            type: 'boolean',
            default: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DISCONTINUED'],
            default: `'DRAFT'`,
          },
          {
            name: 'total_views',
            type: 'int',
            default: 0,
          },
          {
            name: 'author_id',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Books - Genres join table
    await queryRunner.createTable(
      new Table({
        name: 'book_genres',
        columns: [
          {
            name: 'book_id',
            type: 'uuid',
          },
          {
            name: 'genre_id',
            type: 'uuid',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUnique(
      'book_genres',
      new TableUnique({
        columnNames: ['book_id', 'genre_id'],
      }),
    );

    // Chapters table
    await queryRunner.createTable(
      new Table({
        name: 'chapters',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'chapter_number',
            type: 'int',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'chapter_type',
            type: 'enum',
            enum: ['PROLOGUE', 'CHAPTER', 'BONUS', 'EPILOGUE'],
            default: `'CHAPTER'`,
          },
          {
            name: 'status',
            type: 'varchar',
            default: `'PUBLISHED'`,
          },
          {
            name: 'published_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'book_id',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Reviews table
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'rating',
            type: 'int',
          },
          {
            name: 'review_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'book_id',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Comments table
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'comment_text',
            type: 'text',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'chapter_id',
            type: 'uuid',
          },
          {
            name: 'parent_comment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Reading Progress table
    await queryRunner.createTable(
      new Table({
        name: 'reading_progress',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'chapter_id',
            type: 'uuid',
          },
          {
            name: 'progress_percent',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Bookmarks table
    await queryRunner.createTable(
      new Table({
        name: 'bookmarks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'book_id',
            type: 'uuid',
          },
          {
            name: 'chapter_id',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Physical Exchanges table
    await queryRunner.createTable(
      new Table({
        name: 'physical_exchanges',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: `'AVAILABLE'`,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'quantity',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Subscriptions table
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'plan_name',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'varchar',
            default: `'ACTIVE'`,
          },
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'auto_renew',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      'books',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'book_genres',
      new TableForeignKey({
        columnNames: ['book_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'books',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'book_genres',
      new TableForeignKey({
        columnNames: ['genre_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'genres',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'chapters',
      new TableForeignKey({
        columnNames: ['book_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'books',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reviews',
      new TableForeignKey({
        columnNames: ['book_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'books',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['chapter_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chapters',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['parent_comment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'comments',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reading_progress',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reading_progress',
      new TableForeignKey({
        columnNames: ['chapter_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chapters',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bookmarks',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bookmarks',
      new TableForeignKey({
        columnNames: ['book_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'books',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bookmarks',
      new TableForeignKey({
        columnNames: ['chapter_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chapters',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'physical_exchanges',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'subscriptions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique constraints
    await queryRunner.createUnique(
      'reading_progress',
      new TableUnique({
        columnNames: ['user_id', 'chapter_id'],
      }),
    );

    await queryRunner.createUnique(
      'bookmarks',
      new TableUnique({
        columnNames: ['user_id', 'book_id', 'chapter_id'],
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'books',
      new TableIndex({
        columnNames: ['author_id'],
      }),
    );

    await queryRunner.createIndex(
      'chapters',
      new TableIndex({
        columnNames: ['book_id'],
      }),
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        columnNames: ['book_id'],
      }),
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        columnNames: ['chapter_id'],
      }),
    );

    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'reading_progress',
      new TableIndex({
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'bookmarks',
      new TableIndex({
        columnNames: ['user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order
    await queryRunner.dropTable('subscriptions', true);
    await queryRunner.dropTable('physical_exchanges', true);
    await queryRunner.dropTable('bookmarks', true);
    await queryRunner.dropTable('reading_progress', true);
    await queryRunner.dropTable('comments', true);
    await queryRunner.dropTable('reviews', true);
    await queryRunner.dropTable('chapters', true);
    await queryRunner.dropTable('book_genres', true);
    await queryRunner.dropTable('books', true);
    await queryRunner.dropTable('genres', true);
    await queryRunner.dropTable('users', true);
  }
}
