import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExchangeTradeTables1780942000000 implements MigrationInterface {
  name = 'AddExchangeTradeTables1780942000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."exchanges_listingstatus_enum" AS ENUM('ACTIVE', 'CLOSED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "exchanges" ADD "contactNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "exchanges" ADD "listingStatus" "public"."exchanges_listingstatus_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(`ALTER TABLE "exchanges" ADD "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "exchanges" ADD CONSTRAINT "FK_exchanges_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."exchange_requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'MEETING_SCHEDULED', 'COMPLETED', 'CANCELLED', 'REJECTED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "exchange_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exchangeId" uuid NOT NULL,
        "requesterId" uuid NOT NULL,
        "offeredExchangeId" uuid,
        "message" text,
        "status" "public"."exchange_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "meetingLocation" character varying,
        "meetingTime" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exchange_requests" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "exchange_requests" ADD CONSTRAINT "FK_exchange_requests_exchange" FOREIGN KEY ("exchangeId") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exchange_requests" ADD CONSTRAINT "FK_exchange_requests_requester" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exchange_requests" ADD CONSTRAINT "FK_exchange_requests_offered" FOREIGN KEY ("offeredExchangeId") REFERENCES "exchanges"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exchange_requests" DROP CONSTRAINT "FK_exchange_requests_offered"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exchange_requests" DROP CONSTRAINT "FK_exchange_requests_requester"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exchange_requests" DROP CONSTRAINT "FK_exchange_requests_exchange"`,
    );
    await queryRunner.query(`DROP TABLE "exchange_requests"`);
    await queryRunner.query(`DROP TYPE "public"."exchange_requests_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "exchanges" DROP CONSTRAINT "FK_exchanges_user"`,
    );
    await queryRunner.query(`ALTER TABLE "exchanges" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "exchanges" DROP COLUMN "listingStatus"`);
    await queryRunner.query(`DROP TYPE "public"."exchanges_listingstatus_enum"`);
    await queryRunner.query(`ALTER TABLE "exchanges" DROP COLUMN "contactNumber"`);
  }
}
