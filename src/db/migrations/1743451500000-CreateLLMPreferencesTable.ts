import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLLMPreferencesTable1743451500000
  implements MigrationInterface
{
  name = 'CreateLLMPreferencesTable1743451500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user_llm_preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" character varying NOT NULL,
                "activeModel" character varying NOT NULL,
                "modelSettings" json,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_llm_preferences" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_user_llm_preferences_userId" ON "user_llm_preferences" ("userId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_llm_preferences_userId"`);
    await queryRunner.query(`DROP TABLE "user_llm_preferences"`);
  }
}
