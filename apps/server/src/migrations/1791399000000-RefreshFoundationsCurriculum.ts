import { practiceChallenges } from "@kodergarden/shared";
import type { MigrationInterface, QueryRunner } from "typeorm";

const revisionId = "f0000000-0000-4000-8000-000000000002";
const challengeId = (order: number) => `f0000000-0000-4000-8001-${String(order).padStart(12, "0")}`;

export class RefreshFoundationsCurriculum1791399000000 implements MigrationInterface {
  name = "RefreshFoundationsCurriculum1791399000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const campaigns = await queryRunner.query(`SELECT id FROM campaigns WHERE slug = 'foundations'`) as { id: string }[];
    const campaign = campaigns[0];
    if (!campaign) return;
    const existing = await queryRunner.query(`SELECT id FROM campaign_revisions WHERE id = $1`, [revisionId]) as { id: string }[];
    if (existing.length > 0) { await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [revisionId, campaign.id]); return; }
    const versions = await queryRunner.query(`SELECT COALESCE(MAX(version), 0) AS version FROM campaign_revisions WHERE campaign_id = $1`, [campaign.id]) as { version: string }[];
    const version = Number(versions[0]?.version ?? 0) + 1;
    await queryRunner.query(`INSERT INTO campaign_revisions (id,campaign_id,version,status,kind,display_order,published_at) VALUES ($1,$2,$3,'published','guided',1,CURRENT_TIMESTAMP)`, [revisionId,campaign.id,version]);
    for (const locale of ["en","es"]) await queryRunner.query(`INSERT INTO campaign_translations (revision_id,locale,title,description) VALUES ($1,$2,$3,$4)`, [revisionId,locale,"campaign.foundations.title","campaign.foundations.description"]);
    for (const challenge of practiceChallenges) {
      const id=challengeId(challenge.order);
      await queryRunner.query(`INSERT INTO challenges (id,revision_id,slug,display_order,type,world,allowed,starter,max_blocks,par_blocks,par_steps,unlock_key,reference_solution) VALUES ($1,$2,$3,$4,'build',$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12::jsonb)`, [id,revisionId,challenge.id,challenge.order,JSON.stringify(challenge.world),JSON.stringify(challenge.allowed),JSON.stringify(challenge.starter),challenge.maxBlocks??null,challenge.parBlocks??null,challenge.parSteps??null,challenge.unlockKey??null,challenge.referenceSolution?JSON.stringify(challenge.referenceSolution):null]);
      for (const locale of ["en","es"]) await queryRunner.query(`INSERT INTO challenge_translations (challenge_id,locale,title,instruction,concept) VALUES ($1,$2,$3,$4,$5)`, [id,locale,challenge.titleKey,challenge.instructionKey,challenge.conceptKey]);
      for (const [index,layout] of (challenge.worldVariants??[]).entries()) await queryRunner.query(`INSERT INTO challenge_layouts (challenge_id,slug,display_order,world) VALUES ($1,$2,$3,$4::jsonb)`, [id,layout.id,index+1,JSON.stringify(layout.world)]);
    }
    await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [revisionId,campaign.id]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const campaigns = await queryRunner.query(`SELECT id FROM campaigns WHERE slug = 'foundations'`) as { id: string }[];
    const campaign=campaigns[0]; if(!campaign)return;
    const previous = await queryRunner.query(`SELECT id FROM campaign_revisions WHERE campaign_id = $1 AND id <> $2 AND status = 'published' ORDER BY version DESC LIMIT 1`, [campaign.id,revisionId]) as { id:string }[];
    await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [previous[0]?.id??null,campaign.id]);
    await queryRunner.query(`DELETE FROM campaign_revisions WHERE id = $1`, [revisionId]);
  }
}
