import { evaluateChallengeProgram, statementAllowed, validAssessmentPolicy, type PracticeChallengeDefinition } from "@kodergarden/shared";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AdminCatalogResponseV1,
  AdminCampaignHistoryResponseV1,
  AdminDraft,
  AdminDraftResponseV1,
  AdminDraftUpdateV1,
  AdminValidationIssue,
  AdminValidationResponseV1,
  CampaignResponseV1,
} from "@kodergarden/shared";
import { DataSource, type EntityManager } from "typeorm";
import {
  CampaignEntity,
  CampaignRevisionEntity,
  CampaignTranslationEntity,
  ChallengeEntity,
  ChallengeLayoutEntity,
  ChallengeTranslationEntity,
  CurriculumAuditEventEntity,
} from "./catalog.entities.js";
import { CatalogService } from "./catalog.service.js";
import type { EditorTool } from "@kodergarden/shared";
import { AdminUserEntity } from "../auth/auth.entities.js";
import { executeProgram, GridRuntime, type GridWorldDefinition } from "@kodergarden/engine";
import { countBlocks, validateProgram, type Statement } from "@kodergarden/language";

const requiredLocales = ["en", "es"] as const;
const editorTools: readonly EditorTool[] = [
  "moveForward",
  "turn",
  "collect",
  "repeat",
  "if",
  "ifElse",
  "while",
  "repeatUntilGoal",
];
const text = (value: unknown, label: string, max: number) => {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new BadRequestException(
      `${label} is required and must be at most ${max} characters`,
    );
  return value.trim();
};
const positive = (value: unknown, label: string) => {
  if (
    !Number.isInteger(value) ||
    Number(value) < 1 ||
    Number(value) >= 1_000_000
  )
    throw new BadRequestException(
      `${label} must be an integer from 1 to 999999`,
    );
  return Number(value);
};

@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly catalog: CatalogService,
  ) {}

  async overview(): Promise<AdminCatalogResponseV1> {
    const published = await this.catalog.summaries("en");
    const campaigns = await this.dataSource
      .getRepository(CampaignEntity)
      .find();
    const drafts = await this.dataSource
      .getRepository(CampaignRevisionEntity)
      .findBy({ status: "draft" });
    return {
      version: 1,
      campaigns: published.campaigns.map((summary) => {
        const campaign = campaigns.find((item) => item.slug === summary.id);
        const draft = drafts.find((item) => item.campaignId === campaign?.id);
        return {
          ...summary,
          draftRevisionId: draft?.id ?? null,
          draftVersion: draft?.version ?? null,
        };
      }),
    };
  }

  async createDraft(
    slug: string,
    adminUserId: string,
  ): Promise<AdminDraftResponseV1> {
    const id = await this.dataSource.transaction(async (manager) => {
      const campaign = await manager
        .getRepository(CampaignEntity)
        .findOneBy({ slug });
      if (!campaign?.publishedRevisionId)
        throw new NotFoundException("Published campaign not found");
      if (
        await manager
          .getRepository(CampaignRevisionEntity)
          .existsBy({ campaignId: campaign.id, status: "draft" })
      )
        throw new ConflictException("Campaign already has a draft");
      const source = await this.loadedRevision(
        manager,
        campaign.publishedRevisionId,
      );
      const versionRow = await manager
        .getRepository(CampaignRevisionEntity)
        .createQueryBuilder("revision")
        .select("MAX(revision.version)", "max")
        .where("revision.campaignId = :campaignId", { campaignId: campaign.id })
        .getRawOne<{ max: string | null }>();
      const draft = await manager
        .getRepository(CampaignRevisionEntity)
        .save(
          manager
            .getRepository(CampaignRevisionEntity)
            .create({
              campaignId: campaign.id,
              version: Number(versionRow?.max ?? 0) + 1,
              status: "draft",
              kind: source.kind,
              order: source.order,
              publishedAt: null,
            }),
        );
      for (const copy of source.translations)
        await manager
          .getRepository(CampaignTranslationEntity)
          .save(
            manager
              .getRepository(CampaignTranslationEntity)
              .create({
                revisionId: draft.id,
                locale: copy.locale,
                title: copy.title,
                description: copy.description,
              }),
          );
      for (const sourceChallenge of [...source.challenges].sort(
        (a, b) => a.order - b.order,
      )) {
        const challenge = await manager
          .getRepository(ChallengeEntity)
          .save(
            manager
              .getRepository(ChallengeEntity)
              .create({
                revisionId: draft.id,
                slug: sourceChallenge.slug,
                order: sourceChallenge.order,
                type: sourceChallenge.type, assessment: sourceChallenge.assessment,
                world: sourceChallenge.world,
                allowed: sourceChallenge.allowed,
                starter: sourceChallenge.starter,
                maxBlocks: sourceChallenge.maxBlocks,
                parBlocks: sourceChallenge.parBlocks,
                parSteps: sourceChallenge.parSteps,
                unlockKey: sourceChallenge.unlockKey,
                referenceSolution: sourceChallenge.referenceSolution,
              }),
          );
        for (const copy of sourceChallenge.translations)
          await manager
            .getRepository(ChallengeTranslationEntity)
            .save(
              manager
                .getRepository(ChallengeTranslationEntity)
                .create({
                  challengeId: challenge.id,
                  locale: copy.locale,
                  title: copy.title,
                  instruction: copy.instruction,
                  concept: copy.concept,
                }),
            );
        for (const layout of sourceChallenge.layouts)
          await manager
            .getRepository(ChallengeLayoutEntity)
            .save(
              manager
                .getRepository(ChallengeLayoutEntity)
                .create({
                  challengeId: challenge.id,
                  slug: layout.slug,
                  order: layout.order,
                  world: layout.world,
                }),
            );
      }
      await this.audit(
        manager,
        adminUserId,
        campaign.id,
        draft.id,
        "draft.created",
        { sourceRevisionId: source.id },
      );
      return draft.id;
    });
    return this.draft(id);
  }

  async draft(id: string): Promise<AdminDraftResponseV1> {
    const revision = await this.loadedRevision(this.dataSource.manager, id);
    if (revision.status !== "draft")
      throw new NotFoundException("Draft not found");
    const campaign = await this.dataSource
      .getRepository(CampaignEntity)
      .findOneBy({ id: revision.campaignId });
    if (!campaign) throw new NotFoundException("Campaign not found");
    return { version: 1, draft: this.mapDraft(campaign, revision) };
  }

  async updateDraft(
    id: string,
    input: AdminDraftUpdateV1,
    adminUserId: string,
  ): Promise<AdminDraftResponseV1> {
    await this.dataSource.transaction(async (manager) => {
      const revision = await this.loadedRevision(manager, id);
      if (revision.status !== "draft")
        throw new NotFoundException("Draft not found");
      const validated = this.validateInput(input, revision);
      await manager
        .getRepository(CampaignRevisionEntity)
        .update(id, { order: validated.order });
      for (const locale of requiredLocales) {
        const copy = validated.translations[locale];
        await manager
          .getRepository(CampaignTranslationEntity)
          .update(
            { revisionId: id, locale },
            { title: copy.title, description: copy.description },
          );
      }
      for (const [index, challenge] of revision.challenges.entries())
        await manager
          .getRepository(ChallengeEntity)
          .update(challenge.id, { order: 1_000_000 + index });
      for (const item of validated.challenges) {
        const challenge = revision.challenges.find(
          (value) => value.slug === item.slug,
        )!;
        await manager
          .getRepository(ChallengeEntity)
          .update(challenge.id, {
            order: item.order,
            allowed: item.allowed,
            world: item.world,
            starter: item.starter,
            referenceSolution: item.referenceSolution,
            type: item.type ?? "build", assessment: item.assessment ?? null,
            maxBlocks: item.maxBlocks,
            parBlocks: item.parBlocks,
            parSteps: item.parSteps,
          });
        await manager
          .getRepository(ChallengeLayoutEntity)
          .delete({ challengeId: challenge.id });
        for (const layout of item.layouts)
          await manager.getRepository(ChallengeLayoutEntity).save(
            manager.getRepository(ChallengeLayoutEntity).create({
              challengeId: challenge.id,
              slug: layout.slug,
              order: layout.order,
              world: layout.world,
            }),
          );
        for (const locale of requiredLocales) {
          const copy = item.translations[locale];
          await manager
            .getRepository(ChallengeTranslationEntity)
            .update(
              { challengeId: challenge.id, locale },
              {
                title: copy.title,
                instruction: copy.instruction,
                concept: copy.concept,
              },
            );
        }
      }
      await this.audit(
        manager,
        adminUserId,
        revision.campaignId,
        id,
        "draft.updated",
        {},
      );
    });
    return this.draft(id);
  }

  async preview(id: string, localeInput?: string): Promise<CampaignResponseV1> {
    const revision = await this.loadedRevision(this.dataSource.manager, id);
    if (revision.status !== "draft")
      throw new NotFoundException("Draft not found");
    const campaign = await this.dataSource
      .getRepository(CampaignEntity)
      .findOneBy({ id: revision.campaignId });
    if (!campaign) throw new NotFoundException("Campaign not found");
    const locale = localeInput?.toLowerCase().startsWith("es") ? "es" : "en";
    return {
      version: 1,
      campaign: this.catalog.mapRevision(campaign, revision, locale),
    };
  }

  async duplicateChallenge(
    id: string,
    sourceSlug: string,
    newSlugInput: string,
    adminUserId: string,
  ): Promise<AdminDraftResponseV1> {
    const newSlug = newSlugInput.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newSlug) || newSlug.length > 100)
      throw new BadRequestException(
        "Challenge slug must use lowercase letters, numbers, and hyphens",
      );
    await this.dataSource.transaction(async (manager) => {
      const revision = await this.loadedRevision(manager, id);
      if (revision.status !== "draft")
        throw new NotFoundException("Draft not found");
      if (revision.challenges.some((item) => item.slug === newSlug))
        throw new ConflictException("Challenge slug already exists");
      const source = revision.challenges.find(
        (item) => item.slug === sourceSlug,
      );
      if (!source) throw new NotFoundException("Source challenge not found");
      const repository = manager.getRepository(ChallengeEntity);
      const challenge = await repository.save(
        repository.create({
          revisionId: id,
          slug: newSlug,
          order: Math.max(...revision.challenges.map((item) => item.order)) + 1,
          type: source.type, assessment: source.assessment,
          world: source.world,
          allowed: source.allowed,
          starter: source.starter,
          maxBlocks: source.maxBlocks,
          parBlocks: source.parBlocks,
          parSteps: source.parSteps,
          unlockKey: null,
          referenceSolution: source.referenceSolution,
        }),
      );
      for (const locale of requiredLocales) {
        const copy = source.translations.find((item) => item.locale === locale);
        if (!copy) throw new BadRequestException(`Source is missing ${locale}`);
        await manager
          .getRepository(ChallengeTranslationEntity)
          .save(
            manager
              .getRepository(ChallengeTranslationEntity)
              .create({
                challengeId: challenge.id,
                locale,
                title: `${copy.title} copy`,
                instruction: copy.instruction,
                concept: copy.concept,
              }),
          );
      }
      for (const layout of source.layouts)
        await manager
          .getRepository(ChallengeLayoutEntity)
          .save(
            manager
              .getRepository(ChallengeLayoutEntity)
              .create({
                challengeId: challenge.id,
                slug: layout.slug,
                order: layout.order,
                world: layout.world,
              }),
          );
      await this.audit(
        manager,
        adminUserId,
        revision.campaignId,
        id,
        "draft.updated",
        { operation: "challenge.duplicated", sourceSlug, newSlug },
      );
    });
    return this.draft(id);
  }

  async removeChallenge(
    id: string,
    slug: string,
    adminUserId: string,
  ): Promise<AdminDraftResponseV1> {
    await this.dataSource.transaction(async (manager) => {
      const revision = await this.loadedRevision(manager, id);
      if (revision.status !== "draft")
        throw new NotFoundException("Draft not found");
      if (revision.challenges.length <= 1)
        throw new ConflictException(
          "A campaign must contain at least one challenge",
        );
      const challenge = revision.challenges.find((item) => item.slug === slug);
      if (!challenge) throw new NotFoundException("Challenge not found");
      await manager.getRepository(ChallengeEntity).delete(challenge.id);
      await this.audit(
        manager,
        adminUserId,
        revision.campaignId,
        id,
        "draft.updated",
        { operation: "challenge.removed", slug },
      );
    });
    return this.draft(id);
  }

  async publish(id: string, adminUserId: string): Promise<CampaignResponseV1> {
    return this.dataSource.transaction(async (manager) => {
      const revision = await this.loadedRevision(manager, id);
      if (revision.status !== "draft")
        throw new ConflictException("Only drafts can be published");
      const campaign = await manager
        .getRepository(CampaignEntity)
        .findOneBy({ id: revision.campaignId });
      if (!campaign) throw new NotFoundException("Campaign not found");
      const validation = this.validateLoadedRevision(revision);
      if (!validation.valid)
        throw new BadRequestException({
          message: "Draft must pass validation before publishing",
          issues: validation.issues,
        });
      this.catalog.mapRevision(campaign, revision, "en");
      this.catalog.mapRevision(campaign, revision, "es");
      const now = new Date();
      await manager
        .getRepository(CampaignRevisionEntity)
        .update(id, { status: "published", publishedAt: now });
      await manager
        .getRepository(CampaignEntity)
        .update(campaign.id, { publishedRevisionId: id });
      await this.audit(
        manager,
        adminUserId,
        campaign.id,
        id,
        "revision.published",
        { previousRevisionId: campaign.publishedRevisionId },
      );
      revision.status = "published";
      revision.publishedAt = now;
      return {
        version: 1,
        campaign: this.catalog.mapRevision(campaign, revision, "en"),
      };
    });
  }

  async history(slug: string): Promise<AdminCampaignHistoryResponseV1> {
    const campaign = await this.dataSource.getRepository(CampaignEntity).findOneBy({ slug });
    if (!campaign) throw new NotFoundException("Campaign not found");
    const revisions = await this.dataSource.getRepository(CampaignRevisionEntity).find({ where: { campaignId: campaign.id }, order: { version: "DESC" } });
    const events = await this.dataSource.getRepository(CurriculumAuditEventEntity).find({ where: { campaignId: campaign.id }, order: { createdAt: "DESC" }, take: 100 });
    const users = await this.dataSource.getRepository(AdminUserEntity).find();
    return { version: 1, campaignId: slug, revisions: revisions.map((revision) => ({ id: revision.id, version: revision.version, status: revision.status, publishedAt: revision.publishedAt?.toISOString() ?? null, current: revision.id === campaign.publishedRevisionId })), events: events.map((event) => ({ id: event.id, action: event.action, createdAt: event.createdAt.toISOString(), displayName: users.find((user) => user.id === event.adminUserId)?.displayName ?? "Former team member", metadata: event.metadata })) };
  }

  async restoreRevision(slug: string, sourceRevisionId: string, adminUserId: string): Promise<AdminDraftResponseV1> {
    const draftId = await this.dataSource.transaction(async (manager) => {
      const campaign = await manager.getRepository(CampaignEntity).findOneBy({ slug });
      if (!campaign) throw new NotFoundException("Campaign not found");
      if (await manager.getRepository(CampaignRevisionEntity).existsBy({ campaignId: campaign.id, status: "draft" })) throw new ConflictException("Campaign already has a draft");
      const source = await this.loadedRevision(manager, sourceRevisionId);
      if (source.campaignId !== campaign.id || source.status !== "published") throw new BadRequestException("Only a published revision from this campaign can be restored");
      const versionRow = await manager.getRepository(CampaignRevisionEntity).createQueryBuilder("revision").select("MAX(revision.version)", "max").where("revision.campaignId = :campaignId", { campaignId: campaign.id }).getRawOne<{ max: string | null }>();
      const draft = await manager.getRepository(CampaignRevisionEntity).save(manager.getRepository(CampaignRevisionEntity).create({ campaignId: campaign.id, version: Number(versionRow?.max ?? 0) + 1, status: "draft", kind: source.kind, order: source.order, publishedAt: null }));
      for (const copy of source.translations) await manager.getRepository(CampaignTranslationEntity).save(manager.getRepository(CampaignTranslationEntity).create({ revisionId: draft.id, locale: copy.locale, title: copy.title, description: copy.description }));
      for (const sourceChallenge of [...source.challenges].sort((a, b) => a.order - b.order)) {
        const challenge = await manager.getRepository(ChallengeEntity).save(manager.getRepository(ChallengeEntity).create({ revisionId: draft.id, slug: sourceChallenge.slug, order: sourceChallenge.order, type: sourceChallenge.type, assessment: sourceChallenge.assessment, world: sourceChallenge.world, allowed: sourceChallenge.allowed, starter: sourceChallenge.starter, maxBlocks: sourceChallenge.maxBlocks, parBlocks: sourceChallenge.parBlocks, parSteps: sourceChallenge.parSteps, unlockKey: sourceChallenge.unlockKey, referenceSolution: sourceChallenge.referenceSolution }));
        for (const copy of sourceChallenge.translations) await manager.getRepository(ChallengeTranslationEntity).save(manager.getRepository(ChallengeTranslationEntity).create({ challengeId: challenge.id, locale: copy.locale, title: copy.title, instruction: copy.instruction, concept: copy.concept }));
        for (const layout of sourceChallenge.layouts) await manager.getRepository(ChallengeLayoutEntity).save(manager.getRepository(ChallengeLayoutEntity).create({ challengeId: challenge.id, slug: layout.slug, order: layout.order, world: layout.world }));
      }
      await this.audit(manager, adminUserId, campaign.id, draft.id, "draft.restored", { sourceRevisionId });
      return draft.id;
    });
    return this.draft(draftId);
  }

  async validateDraft(id: string): Promise<AdminValidationResponseV1> {
    const revision = await this.loadedRevision(this.dataSource.manager, id);
    if (revision.status !== "draft") throw new NotFoundException("Draft not found");
    return this.validateLoadedRevision(revision);
  }

  private async loadedRevision(manager: EntityManager, id: string) {
    const revision = await manager
      .getRepository(CampaignRevisionEntity)
      .findOne({
        where: { id },
        relations: {
          campaign: true,
          translations: true,
          challenges: { translations: true, layouts: true },
        },
      });
    if (!revision) throw new NotFoundException("Revision not found");
    return revision;
  }
  private mapDraft(
    campaign: CampaignEntity,
    revision: CampaignRevisionEntity,
  ): AdminDraft {
    const campaignCopy = (locale: "en" | "es") => {
      const value = revision.translations.find(
        (item) => item.locale === locale,
      );
      if (!value)
        throw new BadRequestException(`Missing ${locale} campaign translation`);
      return { title: value.title, description: value.description };
    };
    return {
      id: revision.id,
      campaignId: campaign.slug,
      version: revision.version,
      order: revision.order,
      kind: revision.kind,
      translations: { en: campaignCopy("en"), es: campaignCopy("es") },
      challenges: [...revision.challenges]
        .sort((a, b) => a.order - b.order)
        .map((challenge) => {
          const challengeCopy = (locale: "en" | "es") => {
            const value = challenge.translations.find(
              (item) => item.locale === locale,
            );
            if (!value)
              throw new BadRequestException(
                `Missing ${locale} translation for ${challenge.slug}`,
              );
            return {
              title: value.title,
              instruction: value.instruction,
              concept: value.concept,
            };
          };
          return {
            slug: challenge.slug,
            order: challenge.order,
            allowed: challenge.allowed,
            maxBlocks: challenge.maxBlocks,
            type: challenge.type, assessment: challenge.assessment,
            parBlocks: challenge.parBlocks,
            parSteps: challenge.parSteps,
            world: challenge.world,
            layouts: [...challenge.layouts]
              .sort((a, b) => a.order - b.order)
              .map((layout) => ({
                slug: layout.slug,
                order: layout.order,
                world: layout.world,
              })),
            starter: challenge.starter,
            referenceSolution: challenge.referenceSolution,
            translations: { en: challengeCopy("en"), es: challengeCopy("es") },
          };
        }),
    };
  }
  private validateInput(
    input: AdminDraftUpdateV1,
    revision: CampaignRevisionEntity,
  ): AdminDraftUpdateV1 {
    const order = positive(input?.order, "Campaign order");
    if (!input?.translations || !Array.isArray(input.challenges))
      throw new BadRequestException("Translations and challenges are required");
    const translations = {
      en: {
        title: text(input.translations.en?.title, "English title", 200),
        description: text(
          input.translations.en?.description,
          "English description",
          5000,
        ),
      },
      es: {
        title: text(input.translations.es?.title, "Spanish title", 200),
        description: text(
          input.translations.es?.description,
          "Spanish description",
          5000,
        ),
      },
    };
    if (
      input.challenges.length !== revision.challenges.length ||
      new Set(input.challenges.map((item) => item.slug)).size !==
        revision.challenges.length ||
      input.challenges.some(
        (item) =>
          !revision.challenges.some((value) => value.slug === item.slug),
      )
    )
      throw new BadRequestException(
        "Draft challenge set changed while editing; reload and try again",
      );
    const orders = input.challenges.map((item) =>
      positive(item.order, `${item.slug} order`),
    );
    if (new Set(orders).size !== orders.length)
      throw new BadRequestException("Challenge order values must be unique");
    const limit = (value: unknown, label: string) =>
      value === null ? null : positive(value, label);
    const challenges = input.challenges.map((item, index) => {
      if (item.type !== undefined && !["build","predict","debug","family"].includes(item.type)) throw new BadRequestException("Invalid activity type");
      if (item.assessment != null && !validAssessmentPolicy(item.assessment)) throw new BadRequestException("Invalid assessment policy");
      if (item.type === "predict" && item.assessment?.scope !== "active-case") throw new BadRequestException("Predictions need active-case scope");
      if (item.type === "family" && item.assessment?.scope !== "case-family") throw new BadRequestException("Family activities need case-family scope");
      if (
        !Array.isArray(item.allowed) ||
        item.allowed.length === 0 ||
        item.allowed.some((tool: EditorTool) => !editorTools.includes(tool))
      )
        throw new BadRequestException(`${item.slug} needs valid allowed tools`);
      const world = this.validateWorld(item.world, `${item.slug} base layout`);
      const starter = validateProgram(item.starter);
      if (!starter.ok)
        throw new BadRequestException(
          `${item.slug} starter program: ${starter.errors.join(", ")}`,
        );
      const usedTools = this.programTools(starter.program.statements);
      if (usedTools.some((tool) => !item.allowed.includes(tool)))
        throw new BadRequestException(
          `${item.slug} starter program uses a block that is not allowed`,
        );
      if (item.assessment?.correctness !== "discovery" && item.maxBlocks !== null && countBlocks(starter.program) > item.maxBlocks)
        throw new BadRequestException(
          `${item.slug} starter program exceeds its maximum block count`,
        );
      let referenceSolution = null;
      if (item.referenceSolution !== null) {
        const reference = validateProgram(item.referenceSolution);
        if (!reference.ok)
          throw new BadRequestException(
            `${item.slug} reference solution: ${reference.errors.join(", ")}`,
          );
        referenceSolution = reference.program;
      }
      if (!Array.isArray(item.layouts))
        throw new BadRequestException(`${item.slug} layouts must be an array`);
      const layoutSlugs = new Set<string>();
      const layouts = item.layouts.map((layout: { slug: string; world: GridWorldDefinition }, layoutIndex: number) => {
        const slug = text(
          layout?.slug,
          `${item.slug} layout ${layoutIndex + 1} slug`,
          100,
        );
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
          throw new BadRequestException(
            `${item.slug} layout slugs must use lowercase letters, numbers, and hyphens`,
          );
        if (layoutSlugs.has(slug))
          throw new BadRequestException(`${item.slug} layout slugs must be unique`);
        layoutSlugs.add(slug);
        return {
          slug,
          order: layoutIndex + 1,
          world: this.validateWorld(
            layout.world,
            `${item.slug} layout ${slug}`,
          ),
        };
      });
      return {
        slug: item.slug,
        order: orders[index]!,
        allowed: [...new Set(item.allowed as readonly EditorTool[])],
        type: item.type ?? "build", assessment: item.assessment ?? null,
        maxBlocks: limit(item.maxBlocks, `${item.slug} max blocks`),
        parBlocks: limit(item.parBlocks, `${item.slug} par blocks`),
        parSteps: limit(item.parSteps, `${item.slug} par steps`),
        world,
        layouts,
        starter: starter.program,
        referenceSolution,
        translations: {
          en: {
            title: text(
              item.translations.en?.title,
              `${item.slug} English title`,
              200,
            ),
            instruction: text(
              item.translations.en?.instruction,
              `${item.slug} English instruction`,
              5000,
            ),
            concept: text(
              item.translations.en?.concept,
              `${item.slug} English concept`,
              200,
            ),
          },
          es: {
            title: text(
              item.translations.es?.title,
              `${item.slug} Spanish title`,
              200,
            ),
            instruction: text(
              item.translations.es?.instruction,
              `${item.slug} Spanish instruction`,
              5000,
            ),
            concept: text(
              item.translations.es?.concept,
              `${item.slug} Spanish concept`,
              200,
            ),
          },
        },
      };
    });
    return { order, translations, challenges };
  }
  private validateWorld(value: unknown, label: string): GridWorldDefinition {
    try {
      const world = value as GridWorldDefinition;
      new GridRuntime(world);
      if (world.width > 12 || world.height > 12)
        throw new Error("grid dimensions must not exceed 12 by 12");
      const cells = world.blocked.map((cell) => `${cell.x},${cell.y}`);
      if (new Set(cells).size !== cells.length)
        throw new Error("blocked cells must be unique");
      return world;
    } catch (reason) {
      throw new BadRequestException(
        `${label}: ${reason instanceof Error ? reason.message : "invalid grid"}`,
      );
    }
  }
  private programTools(statements: readonly Statement[]): EditorTool[] {
    const tools: EditorTool[] = [];
    for (const statement of statements) {
      if (statement.type === "moveForward") tools.push("moveForward");
      else if (statement.type === "turnLeft" || statement.type === "turnRight")
        tools.push("turn");
      else if (statement.type === "collect") tools.push("collect");
      else if (statement.type === "repeat") {
        tools.push("repeat", ...this.programTools(statement.body));
      } else if (statement.type === "if") {
        tools.push("if", ...this.programTools(statement.body));
      } else if (statement.type === "ifElse") {
        tools.push(
          "ifElse",
          ...this.programTools(statement.thenBody),
          ...this.programTools(statement.elseBody),
        );
      } else if (statement.type === "while") {
        tools.push("while", ...this.programTools(statement.body));
      } else {
        tools.push("repeatUntilGoal", ...this.programTools(statement.body));
      }
    }
    return tools;
  }
  private validateLoadedRevision(revision: CampaignRevisionEntity): AdminValidationResponseV1 {
    const issues: AdminValidationIssue[] = [];
    for (const challenge of revision.challenges) {
      if (challenge.assessment !== null && !validAssessmentPolicy(challenge.assessment)) { issues.push({challengeSlug:challenge.slug,code:"assessment.invalid",message:"Invalid assessment policy"}); continue; }
      if (!["build","predict","debug","family"].includes(challenge.type) || challenge.type === "predict" && challenge.assessment?.scope !== "active-case" || challenge.type === "family" && challenge.assessment?.scope !== "case-family") { issues.push({challengeSlug:challenge.slug,code:"activity.invalid",message:"Activity and evaluation scope do not match"}); continue; }
      const solution = challenge.type === "predict" ? challenge.starter : challenge.referenceSolution;
      if (!solution) { issues.push({challengeSlug:challenge.slug,code:"reference.missing",message:"Provide a reference solution before publishing"}); continue; }
      if (challenge.type === "predict") {
        const valid = validateProgram(challenge.starter);
        if (!valid.ok || valid.program.statements.some(statement=>!statementAllowed(statement,challenge.allowed))) {issues.push({challengeSlug:challenge.slug,code:"prediction.invalid",message:"Prediction starter is invalid or uses disallowed blocks"});continue;}
        for (const world of [challenge.world,...challenge.layouts.map(layout=>layout.world)]) {
          try {const result=executeProgram(valid.program,new GridRuntime(world));if(result.stoppedByLimit)issues.push({challengeSlug:challenge.slug,code:"prediction.limit",message:"Prediction program must terminate normally in every authored case"});}
          catch {issues.push({challengeSlug:challenge.slug,code:"prediction.world",message:"Prediction world is invalid"});}
        }
        continue;
      }
      const validated = validateProgram(solution);
      if (!validated.ok) {
        issues.push({ challengeSlug: challenge.slug, code: "reference.invalid", message: validated.errors.join(", ") });
        continue;
      }
      const disallowed = this.programTools(validated.program.statements).find((tool) => !challenge.allowed.includes(tool));
      if (disallowed)
        issues.push({ challengeSlug: challenge.slug, code: "reference.disallowed", message: `Reference solution uses disallowed block ${disallowed}` });
      const requiredTool = challenge.unlockKey === "repeatUntil" ? "repeatUntilGoal" : challenge.unlockKey;
      const definition: PracticeChallengeDefinition = { id:challenge.slug,campaignId:revision.campaign?.slug ?? "",order:challenge.order,type:challenge.type,titleKey:"",instructionKey:"",conceptKey:"",world:challenge.world,allowed:challenge.allowed,starter:challenge.starter,
        worldVariants:challenge.layouts.map(layout=>({id:layout.slug,world:layout.world})),
        ...(challenge.assessment ? {assessment:challenge.assessment} : {}),
        ...(challenge.maxBlocks === null ? {} : {maxBlocks:challenge.maxBlocks}),
        ...(revision.campaign?.slug === "foundations" ? {maxCollisions:0} : {}),
        ...(!challenge.assessment && requiredTool && editorTools.includes(requiredTool as EditorTool) ? {requiredTools:[requiredTool as EditorTool]} : {}) };
      try {
        // Publishing verifies all authored cases even for an active-case classroom task.
        const result = evaluateChallengeProgram(definition, validated.program, definition.world, "case-family");
        if(challenge.type === "debug" && evaluateChallengeProgram(definition,challenge.starter,definition.world,"case-family").complete)issues.push({challengeSlug:challenge.slug,code:"debug.alreadyCorrect",message:"A repair task needs a starter that fails at least one required case"});
        if (!result.complete) issues.push({challengeSlug:challenge.slug,code:"reference.unsolved",message:`Reference fails shared evaluation (${result.firstFailingLayoutId ?? "constraints"})`});
      } catch (reason) { issues.push({challengeSlug:challenge.slug,code:"layout.invalid",message:reason instanceof Error ? reason.message : "Invalid layout"}); }
    }
    return { version: 1, valid: issues.length === 0, issues };
  }
  private async audit(
    manager: EntityManager,
    adminUserId: string,
    campaignId: string,
    revisionId: string,
    action: CurriculumAuditEventEntity["action"],
    metadata: Record<string, unknown>,
  ) {
    await manager
      .getRepository(CurriculumAuditEventEntity)
      .save(
        manager
          .getRepository(CurriculumAuditEventEntity)
          .create({ adminUserId, campaignId, revisionId, action, metadata }),
      );
  }
}
