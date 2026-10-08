import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialCatalogSchema1791394000000 implements MigrationInterface {
  name = "InitialCatalogSchema1791394000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE campaigns (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug varchar(100) NOT NULL UNIQUE, published_revision_id uuid NULL)`);
    await queryRunner.query(`CREATE TABLE campaign_revisions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT, version integer NOT NULL CHECK (version > 0), status varchar(20) NOT NULL CHECK (status IN ('draft','published')), kind varchar(20) NOT NULL, display_order integer NOT NULL CHECK (display_order > 0), published_at timestamptz NULL, UNIQUE(campaign_id, version))`);
    await queryRunner.query(`ALTER TABLE campaigns ADD CONSTRAINT campaigns_published_revision_fk FOREIGN KEY (published_revision_id) REFERENCES campaign_revisions(id) ON DELETE RESTRICT`);
    await queryRunner.query(`CREATE TABLE campaign_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revision_id uuid NOT NULL REFERENCES campaign_revisions(id) ON DELETE CASCADE, locale varchar(10) NOT NULL, title varchar(200) NOT NULL, description text NOT NULL, UNIQUE(revision_id, locale))`);
    await queryRunner.query(`CREATE TABLE challenges (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revision_id uuid NOT NULL REFERENCES campaign_revisions(id) ON DELETE CASCADE, slug varchar(100) NOT NULL, display_order integer NOT NULL CHECK (display_order > 0), type varchar(20) NOT NULL DEFAULT 'build', world jsonb NOT NULL, allowed jsonb NOT NULL, starter jsonb NOT NULL, max_blocks integer NULL, par_blocks integer NULL, par_steps integer NULL, unlock_key varchar(100) NULL, reference_solution jsonb NULL, UNIQUE(revision_id, slug), UNIQUE(revision_id, display_order))`);
    await queryRunner.query(`CREATE TABLE challenge_translations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE, locale varchar(10) NOT NULL, title varchar(200) NOT NULL, instruction text NOT NULL, concept varchar(200) NOT NULL, UNIQUE(challenge_id, locale))`);
    await queryRunner.query(`CREATE TABLE challenge_layouts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE, slug varchar(100) NOT NULL, display_order integer NOT NULL CHECK (display_order > 0), world jsonb NOT NULL, UNIQUE(challenge_id, slug), UNIQUE(challenge_id, display_order))`);
    await queryRunner.query(`CREATE INDEX campaign_revisions_published_order_idx ON campaign_revisions(status, display_order)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE challenge_layouts`);
    await queryRunner.query(`DROP TABLE challenge_translations`);
    await queryRunner.query(`DROP TABLE challenges`);
    await queryRunner.query(`DROP TABLE campaign_translations`);
    await queryRunner.query(`ALTER TABLE campaigns DROP CONSTRAINT campaigns_published_revision_fk`);
    await queryRunner.query(`DROP TABLE campaign_revisions`);
    await queryRunner.query(`DROP TABLE campaigns`);
  }
}
