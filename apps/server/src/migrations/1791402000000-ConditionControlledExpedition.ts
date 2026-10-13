import { gardenExpeditionChallenges } from "@kodergarden/shared";
import type { MigrationInterface, QueryRunner } from "typeorm";

const revisionId = "e0000000-0000-4000-8000-000000000002";
const challengeId = (order: number) => `e0000000-0000-4000-8002-${String(order).padStart(12, "0")}`;

export class ConditionControlledExpedition1791402000000 implements MigrationInterface {
  name = "ConditionControlledExpedition1791402000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const campaigns = await queryRunner.query(`SELECT id,published_revision_id FROM campaigns WHERE slug = 'garden-expedition'`) as { id: string; published_revision_id: string | null }[];
    const campaign = campaigns[0];
    if (!campaign) return;
    const existing = await queryRunner.query(`SELECT id FROM campaign_revisions WHERE id = $1`, [revisionId]) as { id: string }[];
    if (existing.length > 0) {
      await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [revisionId, campaign.id]);
      return;
    }
    const current = campaign.published_revision_id;
    const versions = await queryRunner.query(`SELECT COALESCE(MAX(version), 0) AS version FROM campaign_revisions WHERE campaign_id = $1`, [campaign.id]) as { version: string }[];
    const version = Number(versions[0]?.version ?? 0) + 1;
    await queryRunner.query(`INSERT INTO campaign_revisions (id,campaign_id,version,status,kind,display_order,published_at) VALUES ($1,$2,$3,'published','advanced',2,CURRENT_TIMESTAMP)`, [revisionId, campaign.id, version]);
    if (current) {
      await queryRunner.query(`INSERT INTO campaign_translations (revision_id,locale,title,description) SELECT $1,locale,title,description FROM campaign_translations WHERE revision_id = $2`, [revisionId, current]);
    } else {
      for (const locale of ["en", "es"])
        await queryRunner.query(`INSERT INTO campaign_translations (revision_id,locale,title,description) VALUES ($1,$2,$3,$4)`, [revisionId, locale, "campaign.expedition.title", "campaign.expedition.description"]);
    }
    for (const challenge of gardenExpeditionChallenges) {
      const id = challengeId(challenge.order);
      await queryRunner.query(
        `INSERT INTO challenges (id,revision_id,slug,display_order,type,assessment,world,allowed,starter,max_blocks,par_blocks,par_steps,unlock_key,reference_solution) VALUES ($1,$2,$3,$4,$5,NULL,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13::jsonb)`,
        [id, revisionId, challenge.id, challenge.order, challenge.type, JSON.stringify(challenge.world), JSON.stringify(challenge.allowed), JSON.stringify(challenge.starter), challenge.maxBlocks ?? null, challenge.parBlocks ?? null, challenge.parSteps ?? null, challenge.unlockKey ?? null, challenge.referenceSolution ? JSON.stringify(challenge.referenceSolution) : null],
      );
      for (const locale of ["en", "es"])
        await queryRunner.query(`INSERT INTO challenge_translations (challenge_id,locale,title,instruction,concept) VALUES ($1,$2,$3,$4,$5)`, [id, locale, challenge.titleKey, challenge.instructionKey, challenge.conceptKey]);
      for (const [index, layout] of (challenge.worldVariants ?? []).entries())
        await queryRunner.query(`INSERT INTO challenge_layouts (challenge_id,slug,display_order,world) VALUES ($1,$2,$3,$4::jsonb)`, [id, layout.id, index + 1, JSON.stringify(layout.world)]);
    }
    await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [revisionId, campaign.id]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const campaigns = await queryRunner.query(`SELECT id FROM campaigns WHERE slug = 'garden-expedition'`) as { id: string }[];
    const campaign = campaigns[0];
    if (!campaign) return;
    const previous = await queryRunner.query(`SELECT id FROM campaign_revisions WHERE campaign_id = $1 AND id <> $2 AND status = 'published' ORDER BY version DESC LIMIT 1`, [campaign.id, revisionId]) as { id: string }[];
    await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [previous[0]?.id ?? null, campaign.id]);
    await queryRunner.query(`DELETE FROM campaign_revisions WHERE id = $1`, [revisionId]);
  }
}
