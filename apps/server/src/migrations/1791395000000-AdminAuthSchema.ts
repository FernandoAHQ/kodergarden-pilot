import type { MigrationInterface, QueryRunner } from "typeorm";

export class AdminAuthSchema1791395000000 implements MigrationInterface {
  name = "AdminAuthSchema1791395000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE admin_users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(320) NOT NULL, display_name varchar(120) NOT NULL, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, disabled_at timestamptz NULL)`);
    await queryRunner.query(`CREATE UNIQUE INDEX admin_users_email_idx ON admin_users (lower(email))`);
    await queryRunner.query(`CREATE TABLE admin_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE, token_hash char(64) NOT NULL UNIQUE, csrf_token varchar(100) NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await queryRunner.query(`CREATE INDEX admin_sessions_expires_at_idx ON admin_sessions(expires_at)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE admin_sessions`);
    await queryRunner.query(`DROP TABLE admin_users`);
  }
}
