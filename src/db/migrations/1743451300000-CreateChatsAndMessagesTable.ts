import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatsAndMessagesTable1743451300000
  implements MigrationInterface
{
  name = 'CreateChatsAndMessagesTable1743451300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chats table
    await queryRunner.query(`
      CREATE TABLE "chats" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_055117cb44822b2b999d1a6c1bc" PRIMARY KEY ("id"),
        CONSTRAINT "FK_87c2c2c4b7c7b61f7b3b8b7b1b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" character varying(50) NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "chatId" uuid NOT NULL,
        CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"),
        CONSTRAINT "FK_7f2e0b3c9c3e9c9c9c9c9c9c9c9" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_chats_userId" ON "chats" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_chatId" ON "messages" ("chatId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_createdAt" ON "messages" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_messages_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_messages_chatId"`);
    await queryRunner.query(`DROP INDEX "IDX_chats_userId"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "chats"`);
  }
}
