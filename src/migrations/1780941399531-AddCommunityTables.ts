import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunityTables1780941399531 implements MigrationInterface {
    name = 'AddCommunityTables1780941399531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "bookId" uuid, "chapterId" uuid, "commentId" uuid, CONSTRAINT "UQ_c375aba0f3323c250caeafcb7fc" UNIQUE ("userId", "commentId"), CONSTRAINT "UQ_9373c0c72c7d1767d5a57f5ad5d" UNIQUE ("userId", "chapterId"), CONSTRAINT "UQ_fec6f5632bbe1e56e7eb948a3b0" UNIQUE ("userId", "bookId"), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "parentId" uuid`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "UQ_0a4dca2ccbf4f106833185b1d4f" UNIQUE ("reviewerId", "bookId")`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_2e040206c3400d3372229e07064" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_310d3eea78d9e5485090c60690b" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_ec3c75d6522fc60e0ebaf58a6b7" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_ec3c75d6522fc60e0ebaf58a6b7"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_310d3eea78d9e5485090c60690b"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_2e040206c3400d3372229e07064"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "UQ_0a4dca2ccbf4f106833185b1d4f"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "parentId"`);
        await queryRunner.query(`DROP TABLE "likes"`);
    }

}
