import type { MigrationInterface, QueryRunner } from "typeorm";

export class CurriculumDrafts1791396000000 implements MigrationInterface {
  name = "CurriculumDrafts1791396000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE UNIQUE INDEX campaign_revisions_one_draft_idx ON campaign_revisions(campaign_id) WHERE status = 'draft'`);
    await queryRunner.query(`CREATE TABLE curriculum_audit_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT, campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT, revision_id uuid NOT NULL REFERENCES campaign_revisions(id) ON DELETE RESTRICT, action varchar(40) NOT NULL CHECK (action IN ('draft.created','draft.updated','revision.published')), metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
    await queryRunner.query(`CREATE INDEX curriculum_audit_campaign_idx ON curriculum_audit_events(campaign_id, created_at DESC)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE curriculum_audit_events`);
    await queryRunner.query(`DROP INDEX campaign_revisions_one_draft_idx`);
  }
}
