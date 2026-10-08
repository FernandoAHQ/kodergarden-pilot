import type { CampaignDefinition } from "./practice.js";

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
  readonly translations: { readonly en: LocalizedChallengeCopy; readonly es: LocalizedChallengeCopy };
}
export interface AdminDraft {
  readonly id: string; readonly campaignId: string; readonly version: number; readonly order: number; readonly kind: CampaignDefinition["kind"];
  readonly translations: { readonly en: LocalizedCampaignCopy; readonly es: LocalizedCampaignCopy };
  readonly challenges: readonly AdminDraftChallenge[];
}
export interface AdminDraftResponseV1 { readonly version: 1; readonly draft: AdminDraft }
export interface AdminDraftUpdateV1 { readonly order: number; readonly translations: AdminDraft["translations"]; readonly challenges: readonly AdminDraftChallenge[] }
