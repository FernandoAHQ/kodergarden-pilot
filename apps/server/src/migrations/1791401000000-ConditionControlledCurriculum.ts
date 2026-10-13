import { pilotCampaign, practiceChallenges, type CampaignDefinition } from "@kodergarden/shared";
import type { MigrationInterface, QueryRunner } from "typeorm";

const revisions = {
  foundations: "f0000000-0000-4000-8000-000000000003",
  "foundations-pilot-v1": "f1000000-0000-4000-8000-000000000002",
} as const;

const challengeId = (campaign: keyof typeof revisions, order: number) => {
  const family = campaign === "foundations" ? "f0000000-0000-4000-8003" : "f1000000-0000-4000-8002";
  return `${family}-${String(order).padStart(12, "0")}`;
};

const sources: Record<keyof typeof revisions, CampaignDefinition> = {
  foundations: { id: "foundations", order: 1, kind: "guided", titleKey: "campaign.foundations.title", descriptionKey: "campaign.foundations.description", challenges: practiceChallenges },
  "foundations-pilot-v1": pilotCampaign,
};

async function publish(queryRunner: QueryRunner, slug: keyof typeof revisions): Promise<void> {
  const rows = await queryRunner.query(`SELECT id FROM campaigns WHERE slug = $1`, [slug]) as { id: string }[];
  const campaign = rows[0];
  if (!campaign) return;
  const revisionId = revisions[slug];
  const existing = await queryRunner.query(`SELECT id FROM campaign_revisions WHERE id = $1`, [revisionId]) as { id: string }[];
  if (existing.length > 0) {
    await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [revisionId, campaign.id]);
    return;
  }

  const source = sources[slug];
  const versions = await queryRunner.query(`SELECT COALESCE(MAX(version), 0) AS version FROM campaign_revisions WHERE campaign_id = $1`, [campaign.id]) as { version: string }[];
  const version = Number(versions[0]?.version ?? 0) + 1;
  await queryRunner.query(
    `INSERT INTO campaign_revisions (id,campaign_id,version,status,kind,display_order,published_at) VALUES ($1,$2,$3,'published',$4,$5,CURRENT_TIMESTAMP)`,
    [revisionId, campaign.id, version, source.kind, source.order],
  );
  for (const locale of ["en", "es"])
    await queryRunner.query(
      `INSERT INTO campaign_translations (revision_id,locale,title,description) VALUES ($1,$2,$3,$4)`,
      [revisionId, locale, source.titleKey, source.descriptionKey],
    );
  for (const challenge of source.challenges) {
    const id = challengeId(slug, challenge.order);
    await queryRunner.query(
      `INSERT INTO challenges (id,revision_id,slug,display_order,type,assessment,world,allowed,starter,max_blocks,par_blocks,par_steps,unlock_key,reference_solution) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12,$13,$14::jsonb)`,
      [id, revisionId, challenge.id, challenge.order, challenge.type, challenge.assessment ? JSON.stringify(challenge.assessment) : null, JSON.stringify(challenge.world), JSON.stringify(challenge.allowed), JSON.stringify(challenge.starter), challenge.maxBlocks ?? null, challenge.parBlocks ?? null, challenge.parSteps ?? null, challenge.unlockKey ?? null, challenge.referenceSolution ? JSON.stringify(challenge.referenceSolution) : null],
    );
    for (const locale of ["en", "es"])
      await queryRunner.query(
        `INSERT INTO challenge_translations (challenge_id,locale,title,instruction,concept) VALUES ($1,$2,$3,$4,$5)`,
        [id, locale, challenge.titleKey, challenge.instructionKey, challenge.conceptKey],
      );
    for (const [index, layout] of (challenge.worldVariants ?? []).entries())
      await queryRunner.query(
        `INSERT INTO challenge_layouts (challenge_id,slug,display_order,world) VALUES ($1,$2,$3,$4::jsonb)`,
        [id, layout.id, index + 1, JSON.stringify(layout.world)],
      );
  }
  await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [revisionId, campaign.id]);
}

export class ConditionControlledCurriculum1791401000000 implements MigrationInterface {
  name = "ConditionControlledCurriculum1791401000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await publish(queryRunner, "foundations");
    await publish(queryRunner, "foundations-pilot-v1");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const slug of ["foundations-pilot-v1", "foundations"] as const) {
      const rows = await queryRunner.query(`SELECT id FROM campaigns WHERE slug = $1`, [slug]) as { id: string }[];
      const campaign = rows[0];
      if (!campaign) continue;
      const previous = await queryRunner.query(
        `SELECT id FROM campaign_revisions WHERE campaign_id = $1 AND id <> $2 AND status = 'published' ORDER BY version DESC LIMIT 1`,
        [campaign.id, revisions[slug]],
      ) as { id: string }[];
      await queryRunner.query(`UPDATE campaigns SET published_revision_id = $1 WHERE id = $2`, [previous[0]?.id ?? null, campaign.id]);
      await queryRunner.query(`DELETE FROM campaign_revisions WHERE id = $1`, [revisions[slug]]);
    }
  }
}
