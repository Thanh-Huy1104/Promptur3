import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMCPTables1743451400000 implements MigrationInterface {
  name = 'CreateMCPTables1743451400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create mcp_user_sessions table
    await queryRunner.query(`
      CREATE TABLE "mcp_user_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "serverName" character varying(255) NOT NULL,
        "sessionId" character varying(255),
        "connectedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mcp_user_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_mcp_user_sessions_userId_serverName" UNIQUE ("userId", "serverName"),
        CONSTRAINT "FK_mcp_user_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create mcp_user_tools table
    await queryRunner.query(`
      CREATE TABLE "mcp_user_tools" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "qualifiedToolName" character varying(255) NOT NULL,
        "description" text,
        "isEnabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_mcp_user_tools" PRIMARY KEY ("id"),
        CONSTRAINT "FK_mcp_user_tools_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_mcp_user_sessions_userId" ON "mcp_user_sessions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mcp_user_sessions_serverName" ON "mcp_user_sessions" ("serverName")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mcp_user_tools_userId" ON "mcp_user_tools" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mcp_user_tools_qualifiedToolName" ON "mcp_user_tools" ("qualifiedToolName")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mcp_user_tools_isEnabled" ON "mcp_user_tools" ("isEnabled")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_mcp_user_tools_isEnabled"`);
    await queryRunner.query(
      `DROP INDEX "IDX_mcp_user_tools_qualifiedToolName"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_mcp_user_tools_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_mcp_user_sessions_serverName"`);
    await queryRunner.query(`DROP INDEX "IDX_mcp_user_sessions_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "mcp_user_tools"`);
    await queryRunner.query(`DROP TABLE "mcp_user_sessions"`);
  }
}
