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
  readonly campaigns: readonly CatalogSummary[];
}
