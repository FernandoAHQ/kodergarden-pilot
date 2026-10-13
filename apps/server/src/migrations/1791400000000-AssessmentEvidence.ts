import type { MigrationInterface, QueryRunner } from "typeorm";

/** Additive: preserves historical programs, revisions and completion identifiers. */
export class AssessmentEvidence1791400000000 implements MigrationInterface {
  name = "AssessmentEvidence1791400000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE challenges ADD COLUMN assessment jsonb NULL`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE challenges DROP COLUMN assessment`);
  }
}
