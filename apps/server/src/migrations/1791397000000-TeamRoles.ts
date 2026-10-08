import type { MigrationInterface, QueryRunner } from "typeorm";

export class TeamRoles1791397000000 implements MigrationInterface {
  name = "TeamRoles1791397000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE admin_users ADD COLUMN role varchar(20) NOT NULL DEFAULT 'admin'`);
    await queryRunner.query(`ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('admin','viewer'))`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check`);
    await queryRunner.query(`ALTER TABLE admin_users DROP COLUMN role`);
  }
}
