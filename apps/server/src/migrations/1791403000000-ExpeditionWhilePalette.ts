import type { MigrationInterface, QueryRunner } from "typeorm";

/** Correct the palette on the immediately preceding built-in Expedition revision. */
export class ExpeditionWhilePalette1791403000000 implements MigrationInterface {
  name = "ExpeditionWhilePalette1791403000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE challenges SET allowed = '["moveForward","turn","repeat","if","while"]'::jsonb WHERE revision_id = 'e0000000-0000-4000-8000-000000000002' AND slug = 'expedition-gate-check'`,
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE challenges SET allowed = '["moveForward","turn","repeat","if"]'::jsonb WHERE revision_id = 'e0000000-0000-4000-8000-000000000002' AND slug = 'expedition-gate-check'`,
    );
  }
}
