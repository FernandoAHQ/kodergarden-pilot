import { campaigns as seedCampaigns } from "@kodergarden/shared";
import type { DataSource } from "typeorm";
import { CampaignEntity, CampaignRevisionEntity, CampaignTranslationEntity, ChallengeEntity, ChallengeLayoutEntity, ChallengeTranslationEntity } from "./catalog.entities.js";

export async function seedCatalog(dataSource: DataSource): Promise<void> {
  await dataSource.transaction(async (manager) => {
    for (const source of seedCampaigns) {
      let campaign = await manager.findOne(CampaignEntity, { where: { slug: source.id } });
      if (!campaign) campaign = await manager.save(CampaignEntity, manager.create(CampaignEntity, { slug: source.id, publishedRevisionId: null }));
      if (campaign.publishedRevisionId) continue;
      const revision = await manager.save(CampaignRevisionEntity, manager.create(CampaignRevisionEntity, { campaignId: campaign.id, version: 1, status: "published", kind: source.kind, order: source.order, publishedAt: new Date() }));
      for (const locale of ["en", "es"] as const) await manager.save(CampaignTranslationEntity, manager.create(CampaignTranslationEntity, { revisionId: revision.id, locale, title: source.titleKey, description: source.descriptionKey }));
      for (const sourceChallenge of source.challenges) {
        const challenge = await manager.save(ChallengeEntity, manager.create(ChallengeEntity, { revisionId: revision.id, slug: sourceChallenge.id, order: sourceChallenge.order, type: "build", world: sourceChallenge.world, allowed: sourceChallenge.allowed, starter: sourceChallenge.starter, maxBlocks: sourceChallenge.maxBlocks ?? null, parBlocks: sourceChallenge.parBlocks ?? null, parSteps: sourceChallenge.parSteps ?? null, unlockKey: sourceChallenge.unlockKey ?? null, referenceSolution: sourceChallenge.referenceSolution ?? null }));
        for (const locale of ["en", "es"] as const) await manager.save(ChallengeTranslationEntity, manager.create(ChallengeTranslationEntity, { challengeId: challenge.id, locale, title: sourceChallenge.titleKey, instruction: sourceChallenge.instructionKey, concept: sourceChallenge.conceptKey }));
        for (const [index, layout] of (sourceChallenge.worldVariants ?? []).entries()) await manager.save(ChallengeLayoutEntity, manager.create(ChallengeLayoutEntity, { challengeId: challenge.id, slug: layout.id, order: index + 1, world: layout.world }));
      }
      campaign.publishedRevisionId = revision.id;
      await manager.save(CampaignEntity, campaign);
    }
  });
}
