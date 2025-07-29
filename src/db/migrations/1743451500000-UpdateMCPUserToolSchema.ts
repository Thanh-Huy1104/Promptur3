import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateMCPUserToolSchema1743451500000
  implements MigrationInterface
{
  name = 'UpdateMCPUserToolSchema1743451500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if qualifiedToolName column exists
    const hasQualifiedToolName = await queryRunner.hasColumn(
      'mcp_user_tools',
      'qualifiedToolName',
    );

    if (hasQualifiedToolName) {
      // First, update any null values in qualifiedToolName to empty string
      await queryRunner.query(`
        UPDATE "mcp_user_tools" 
        SET "qualifiedToolName" = '' 
        WHERE "qualifiedToolName" IS NULL
      `);

      // Rename qualifiedToolName column to name
      await queryRunner.renameColumn(
        'mcp_user_tools',
        'qualifiedToolName',
        'name',
      );
    }

    // Add inputSchema column if it doesn't exist
    const hasInputSchema = await queryRunner.hasColumn(
      'mcp_user_tools',
      'inputSchema',
    );

    if (!hasInputSchema) {
      await queryRunner.addColumn(
        'mcp_user_tools',
        new TableColumn({
          name: 'inputSchema',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove inputSchema column if it exists
    const hasInputSchema = await queryRunner.hasColumn(
      'mcp_user_tools',
      'inputSchema',
    );

    if (hasInputSchema) {
      await queryRunner.dropColumn('mcp_user_tools', 'inputSchema');
    }

    // Check if name column exists
    const hasName = await queryRunner.hasColumn('mcp_user_tools', 'name');

    if (hasName) {
      // Rename name column back to qualifiedToolName
      await queryRunner.renameColumn(
        'mcp_user_tools',
        'name',
        'qualifiedToolName',
      );
    }
  }
}
