import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CampaignDefinition, CampaignResponseV1, CatalogResponseV1 } from "@kodergarden/shared";
import { useI18n } from "./i18n.js";

interface CatalogState { readonly campaigns: readonly CampaignDefinition[]; readonly loading: boolean; readonly error: string | null; readonly retry: () => void }
const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { readonly children: ReactNode }) {
  const { locale } = useI18n();
  const [campaigns, setCampaigns] = useState<readonly CampaignDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const control = new AbortController(); setLoading(true); setError(null);
    void (async () => {
      try {
        const catalogResponse = await fetch(`/api/catalog?locale=${locale}`, { signal: control.signal });
        if (!catalogResponse.ok) throw new Error(`Catalog request failed (${catalogResponse.status})`);
        const catalog = await catalogResponse.json() as CatalogResponseV1;
        const loaded = await Promise.all(catalog.campaigns.map(async (summary) => {
          const response = await fetch(`/api/campaigns/${encodeURIComponent(summary.id)}?locale=${locale}`, { signal: control.signal });
          if (!response.ok) throw new Error(`Campaign request failed (${response.status})`);
          return (await response.json() as CampaignResponseV1).campaign;
        }));
        setCampaigns(loaded); setLoading(false);
      } catch (reason) { if (!control.signal.aborted) { setError(reason instanceof Error ? reason.message : "Catalog unavailable"); setLoading(false); } }
    })();
    return () => control.abort();
  }, [attempt, locale]);
  const value = useMemo(() => ({ campaigns, loading, error, retry: () => setAttempt((value) => value + 1) }), [campaigns, error, loading]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogState { const value = useContext(CatalogContext); if (!value) throw new Error("CatalogProvider missing"); return value; }
export const findCampaign = (campaigns: readonly CampaignDefinition[], id: string | null | undefined) => campaigns.find((campaign) => campaign.id === id);
export const findChallenge = (campaigns: readonly CampaignDefinition[], id: string | null | undefined) => campaigns.flatMap((campaign) => campaign.challenges).find((challenge) => challenge.id === id);
