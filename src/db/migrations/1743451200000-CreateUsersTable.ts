import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1743451200000 implements MigrationInterface {
  name = 'CreateUsersTable1743451200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "language" character varying(10) NOT NULL DEFAULT 'en',
        "timezone" character varying(50) NOT NULL DEFAULT 'UTC',
        "emailNotifications" boolean NOT NULL DEFAULT true,
        "darkMode" boolean NOT NULL DEFAULT false,
        "preferences" jsonb,
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
