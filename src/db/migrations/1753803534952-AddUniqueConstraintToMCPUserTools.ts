import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToMCPUserTools1753803534952 implements MigrationInterface {
    name = 'AddUniqueConstraintToMCPUserTools1753803534952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mcp_user_tools" ADD CONSTRAINT "UQ_user_tool_name" UNIQUE ("userId", "name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mcp_user_tools" DROP CONSTRAINT "UQ_user_tool_name"`);
    }

}
