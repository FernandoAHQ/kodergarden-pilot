import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GridRuntime } from "@kodergarden/engine";
import { validateProgram } from "@kodergarden/language";
import type { CampaignResponseV1, CatalogCampaignDefinition, CatalogResponseV1, PracticeChallengeDefinition } from "@kodergarden/shared";
import { Repository } from "typeorm";
import { CampaignEntity, CampaignRevisionEntity } from "./catalog.entities.js";

const localeOf = (input?: string): "en" | "es" => input?.toLowerCase().startsWith("es") ? "es" : "en";

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CampaignEntity) private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(CampaignRevisionEntity) private readonly revisions: Repository<CampaignRevisionEntity>,
  ) {}

  async summaries(localeInput?: string): Promise<CatalogResponseV1> {
    const locale = localeOf(localeInput);
    const rows = await this.publishedRows();
    return { version: 1, campaigns: rows.map(({ campaign, revision }) => {
      const translation = this.translation(revision.translations, locale);
      return { id: campaign.slug, revisionId: revision.id, order: revision.order, kind: revision.kind, titleKey: translation.title, descriptionKey: translation.description, challengeCount: revision.challenges.length };
    }) };
  }

  async campaign(slug: string, localeInput?: string): Promise<CampaignResponseV1> {
    const row = (await this.publishedRows()).find(({ campaign }) => campaign.slug === slug);
    if (!row) throw new NotFoundException("Campaign not found");
    return { version: 1, campaign: this.mapRevision(row.campaign, row.revision, localeOf(localeInput)) };
  }

  async allCampaigns(locale = "en"): Promise<readonly CatalogCampaignDefinition[]> {
    const rows = await this.publishedRows();
    return rows.map(({ campaign, revision }) => this.mapRevision(campaign, revision, localeOf(locale)));
  }

  async isReady(): Promise<boolean> {
    try { await this.campaigns.query("SELECT 1"); return true; } catch { return false; }
  }

  private async publishedRows() {
    const campaigns = await this.campaigns.find({ order: { slug: "ASC" } });
    const rows = await Promise.all(campaigns.filter((campaign) => campaign.publishedRevisionId).map(async (campaign) => {
      const revision = await this.revisions.findOne({ where: { id: campaign.publishedRevisionId! }, relations: { translations: true, challenges: { translations: true, layouts: true } } });
      if (!revision || revision.status !== "published") throw new Error(`Published revision missing for ${campaign.slug}`);
      return { campaign, revision };
    }));
    return rows.sort((left, right) => left.revision.order - right.revision.order);
  }

  mapRevision(campaign: CampaignEntity, revision: CampaignRevisionEntity, locale: "en" | "es"): CatalogCampaignDefinition {
    const translation = this.translation(revision.translations, locale);
    const challenges = [...revision.challenges].sort((a, b) => a.order - b.order).map((challenge): PracticeChallengeDefinition => {
      const copy = this.translation(challenge.translations, locale);
      new GridRuntime(challenge.world);
      if (!Array.isArray(challenge.allowed)) throw new Error(`Invalid allowed tools for ${challenge.slug}`);
      const starter = validateProgram(challenge.starter); if (!starter.ok) throw new Error(`Invalid starter program for ${challenge.slug}`);
      const reference = challenge.referenceSolution ? validateProgram(challenge.referenceSolution) : null; if (reference && !reference.ok) throw new Error(`Invalid reference solution for ${challenge.slug}`);
      return { id: challenge.slug, campaignId: campaign.slug, order: challenge.order, type: "build", titleKey: copy.title, instructionKey: copy.instruction, conceptKey: copy.concept, world: challenge.world, allowed: challenge.allowed, starter: starter.program,
        ...(challenge.layouts.length ? { worldVariants: [...challenge.layouts].sort((a,b)=>a.order-b.order).map((layout)=>({ id: layout.slug, world: layout.world })) } : {}),
        ...(challenge.maxBlocks === null ? {} : { maxBlocks: challenge.maxBlocks }), ...(challenge.parBlocks === null ? {} : { parBlocks: challenge.parBlocks }), ...(challenge.parSteps === null ? {} : { parSteps: challenge.parSteps }), ...(challenge.unlockKey === null ? {} : { unlockKey: challenge.unlockKey }), ...(reference?.ok ? { referenceSolution: reference.program } : {}) };
    });
    return { id: campaign.slug, revisionId: revision.id, order: revision.order, kind: revision.kind, titleKey: translation.title, descriptionKey: translation.description, challenges };
  }

  private translation<T extends { locale: string }>(translations: readonly T[], locale: "en" | "es"): T {
    const value = translations.find((item) => item.locale === locale) ?? translations.find((item) => item.locale === "en");
    if (!value || !translations.some((item) => item.locale === "en") || !translations.some((item) => item.locale === "es")) throw new Error("Published catalog requires English and Spanish translations");
    return value;
  }
}
