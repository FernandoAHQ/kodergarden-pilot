import type { MigrationInterface, QueryRunner } from "typeorm";

export class ParameterizedControlFlow1791398000000 implements MigrationInterface {
  name = "ParameterizedControlFlow1791398000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE challenges SET allowed = (SELECT jsonb_agg(CASE value #>> '{}' WHEN 'ifPathAhead' THEN '"if"'::jsonb WHEN 'ifElsePathAhead' THEN '"ifElse"'::jsonb ELSE value END ORDER BY ordinal) FROM jsonb_array_elements(allowed) WITH ORDINALITY AS tools(value, ordinal))`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE challenges SET allowed = (SELECT jsonb_agg(CASE value #>> '{}' WHEN 'if' THEN '"ifPathAhead"'::jsonb WHEN 'ifElse' THEN '"ifElsePathAhead"'::jsonb ELSE value END ORDER BY ordinal) FROM jsonb_array_elements(allowed) WITH ORDINALITY AS tools(value, ordinal))`);
  }
}
