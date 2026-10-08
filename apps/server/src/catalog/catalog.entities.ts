import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { GridWorldDefinition } from "@kodergarden/engine";
import type { Program } from "@kodergarden/language";
import type { CampaignKind, EditorTool } from "@kodergarden/shared";

@Entity("campaigns")
export class CampaignEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index({ unique: true }) @Column({ type: "varchar", length: 100 }) slug!: string;
  @Column({ name: "published_revision_id", type: "uuid", nullable: true }) publishedRevisionId!: string | null;
  @OneToMany(() => CampaignRevisionEntity, (revision) => revision.campaign) revisions!: CampaignRevisionEntity[];
}

@Entity("campaign_revisions")
@Index(["campaignId", "version"], { unique: true })
export class CampaignRevisionEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "campaign_id", type: "uuid" }) campaignId!: string;
  @ManyToOne(() => CampaignEntity, (campaign) => campaign.revisions, { onDelete: "RESTRICT" }) @JoinColumn({ name: "campaign_id" }) campaign!: CampaignEntity;
  @Column({ type: "integer" }) version!: number;
  @Column({ type: "varchar", length: 20 }) status!: "draft" | "published";
  @Column({ type: "varchar", length: 20 }) kind!: CampaignKind;
  @Column({ name: "display_order", type: "integer" }) order!: number;
  @Column({ name: "published_at", type: "timestamptz", nullable: true }) publishedAt!: Date | null;
  @OneToMany(() => CampaignTranslationEntity, (translation) => translation.revision) translations!: CampaignTranslationEntity[];
  @OneToMany(() => ChallengeEntity, (challenge) => challenge.revision) challenges!: ChallengeEntity[];
}

@Entity("campaign_translations")
@Index(["revisionId", "locale"], { unique: true })
export class CampaignTranslationEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "revision_id", type: "uuid" }) revisionId!: string;
  @ManyToOne(() => CampaignRevisionEntity, (revision) => revision.translations, { onDelete: "CASCADE" }) @JoinColumn({ name: "revision_id" }) revision!: CampaignRevisionEntity;
  @Column({ type: "varchar", length: 10 }) locale!: string;
  @Column({ type: "varchar", length: 200 }) title!: string;
  @Column({ type: "text" }) description!: string;
}

@Entity("challenges")
@Index(["revisionId", "slug"], { unique: true })
@Index(["revisionId", "order"], { unique: true })
export class ChallengeEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "revision_id", type: "uuid" }) revisionId!: string;
  @ManyToOne(() => CampaignRevisionEntity, (revision) => revision.challenges, { onDelete: "CASCADE" }) @JoinColumn({ name: "revision_id" }) revision!: CampaignRevisionEntity;
  @Column({ type: "varchar", length: 100 }) slug!: string;
  @Column({ name: "display_order", type: "integer" }) order!: number;
  @Column({ type: "varchar", length: 20, default: "build" }) type!: "build";
  @Column({ type: "jsonb" }) world!: GridWorldDefinition;
  @Column({ type: "jsonb" }) allowed!: readonly EditorTool[];
  @Column({ type: "jsonb" }) starter!: Program;
  @Column({ name: "max_blocks", type: "integer", nullable: true }) maxBlocks!: number | null;
  @Column({ name: "par_blocks", type: "integer", nullable: true }) parBlocks!: number | null;
  @Column({ name: "par_steps", type: "integer", nullable: true }) parSteps!: number | null;
  @Column({ name: "unlock_key", type: "varchar", length: 100, nullable: true }) unlockKey!: string | null;
  @Column({ name: "reference_solution", type: "jsonb", nullable: true }) referenceSolution!: Program | null;
  @OneToMany(() => ChallengeTranslationEntity, (translation) => translation.challenge) translations!: ChallengeTranslationEntity[];
  @OneToMany(() => ChallengeLayoutEntity, (layout) => layout.challenge) layouts!: ChallengeLayoutEntity[];
}

@Entity("challenge_translations")
@Index(["challengeId", "locale"], { unique: true })
export class ChallengeTranslationEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "challenge_id", type: "uuid" }) challengeId!: string;
  @ManyToOne(() => ChallengeEntity, (challenge) => challenge.translations, { onDelete: "CASCADE" }) @JoinColumn({ name: "challenge_id" }) challenge!: ChallengeEntity;
  @Column({ type: "varchar", length: 10 }) locale!: string;
  @Column({ type: "varchar", length: 200 }) title!: string;
  @Column({ type: "text" }) instruction!: string;
  @Column({ type: "varchar", length: 200 }) concept!: string;
}

@Entity("challenge_layouts")
@Index(["challengeId", "slug"], { unique: true })
export class ChallengeLayoutEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "challenge_id", type: "uuid" }) challengeId!: string;
  @ManyToOne(() => ChallengeEntity, (challenge) => challenge.layouts, { onDelete: "CASCADE" }) @JoinColumn({ name: "challenge_id" }) challenge!: ChallengeEntity;
  @Column({ type: "varchar", length: 100 }) slug!: string;
  @Column({ name: "display_order", type: "integer" }) order!: number;
  @Column({ type: "jsonb" }) world!: GridWorldDefinition;
}

@Entity("curriculum_audit_events")
export class CurriculumAuditEventEntity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "admin_user_id", type: "uuid" }) adminUserId!: string;
  @Column({ name: "campaign_id", type: "uuid" }) campaignId!: string;
  @Column({ name: "revision_id", type: "uuid" }) revisionId!: string;
  @Column({ type: "varchar", length: 40 }) action!: "draft.created" | "draft.updated" | "draft.restored" | "revision.published";
  @Column({ type: "jsonb", default: () => "'{}'::jsonb" }) metadata!: Record<string, unknown>;
  @Column({ name: "created_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" }) createdAt!: Date;
}

export const catalogEntities = [CampaignEntity, CampaignRevisionEntity, CampaignTranslationEntity, ChallengeEntity, ChallengeTranslationEntity, ChallengeLayoutEntity, CurriculumAuditEventEntity];
