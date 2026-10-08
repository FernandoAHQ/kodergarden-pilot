import type { CampaignDefinition } from "./practice.js";
import type { GridWorldDefinition } from "@kodergarden/engine";
import type { Program } from "@kodergarden/language";

export interface CatalogCampaignDefinition extends CampaignDefinition {
  readonly revisionId: string;
}

export interface CatalogSummary {
  readonly id: string;
  readonly revisionId: string;
  readonly order: number;
  readonly kind: CampaignDefinition["kind"];
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly challengeCount: number;
}

export interface CatalogResponseV1 {
  readonly version: 1;
  readonly campaigns: readonly CatalogSummary[];
}

export interface CampaignResponseV1 {
  readonly version: 1;
  readonly campaign: CatalogCampaignDefinition;
}

export interface AdminIdentity {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: "admin" | "viewer";
}

export interface AdminSessionResponseV1 {
  readonly version: 1;
  readonly user: AdminIdentity;
  readonly csrfToken: string;
  readonly expiresAt: string;
}

export interface AdminCatalogResponseV1 {
  readonly version: 1;
  readonly campaigns: readonly AdminCampaignSummary[];
}

export interface AdminCampaignSummary extends CatalogSummary {
  readonly draftRevisionId: string | null;
  readonly draftVersion: number | null;
}

export interface LocalizedCampaignCopy { readonly title: string; readonly description: string }
export interface LocalizedChallengeCopy { readonly title: string; readonly instruction: string; readonly concept: string }
export interface AdminDraftChallenge {
  readonly slug: string; readonly order: number;
  readonly allowed: readonly import("./practice.js").EditorTool[];
  readonly maxBlocks: number | null; readonly parBlocks: number | null; readonly parSteps: number | null;
  readonly world: GridWorldDefinition;
  readonly layouts: readonly { readonly slug: string; readonly order: number; readonly world: GridWorldDefinition }[];
  readonly starter: Program;
  readonly referenceSolution: Program | null;
  readonly translations: { readonly en: LocalizedChallengeCopy; readonly es: LocalizedChallengeCopy };
}
export interface AdminDraft {
  readonly id: string; readonly campaignId: string; readonly version: number; readonly order: number; readonly kind: CampaignDefinition["kind"];
  readonly translations: { readonly en: LocalizedCampaignCopy; readonly es: LocalizedCampaignCopy };
  readonly challenges: readonly AdminDraftChallenge[];
}
export interface AdminDraftResponseV1 { readonly version: 1; readonly draft: AdminDraft }
export interface AdminDraftUpdateV1 { readonly order: number; readonly translations: AdminDraft["translations"]; readonly challenges: readonly AdminDraftChallenge[] }
export interface AdminValidationIssue { readonly challengeSlug: string | null; readonly code: string; readonly message: string }
export interface AdminValidationResponseV1 { readonly version: 1; readonly valid: boolean; readonly issues: readonly AdminValidationIssue[] }
export interface AdminTeamMember extends AdminIdentity { readonly disabled: boolean; readonly createdAt: string }
export interface AdminTeamResponseV1 { readonly version: 1; readonly members: readonly AdminTeamMember[] }
export interface AdminRevisionHistoryItem { readonly id: string; readonly version: number; readonly status: "draft" | "published"; readonly publishedAt: string | null; readonly current: boolean }
export interface AdminAuditHistoryItem { readonly id: string; readonly action: string; readonly createdAt: string; readonly displayName: string; readonly metadata: Readonly<Record<string, unknown>> }
export interface AdminCampaignHistoryResponseV1 { readonly version: 1; readonly campaignId: string; readonly revisions: readonly AdminRevisionHistoryItem[]; readonly events: readonly AdminAuditHistoryItem[] }
