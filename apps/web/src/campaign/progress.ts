export interface ChallengeBest { readonly completed: true; readonly stars: 1 | 2 | 3; readonly bestBlocks: number; readonly bestSteps: number }
export interface CampaignProgress { readonly version: 1; readonly campaigns: Readonly<Record<string, Readonly<Record<string, ChallengeBest>>>> }
const storageKey = "kodergarden.campaign.progress.v1";
export const emptyCampaignProgress = (): CampaignProgress => ({ version: 1, campaigns: {} });
export const starsForRun = (goalReached: boolean, blocks: number, steps: number, parBlocks: number, parSteps: number): 0 | 1 | 2 | 3 => !goalReached ? 0 : blocks > parBlocks ? 1 : steps > parSteps ? 2 : 3;
export const campaignChallengeUnlocked = (order: number, challengeIds: readonly string[], progress: CampaignProgress, campaignId: string): boolean => order === 1 || Boolean(progress.campaigns[campaignId]?.[challengeIds[order - 2] ?? ""]?.completed);
export function recordCampaignRun(progress: CampaignProgress, campaignId: string, challengeId: string, blocks: number, steps: number, stars: 1 | 2 | 3): CampaignProgress {
  const current = progress.campaigns[campaignId]?.[challengeId];
  const result: ChallengeBest = { completed: true, stars: Math.max(current?.stars ?? 0, stars) as 1 | 2 | 3, bestBlocks: Math.min(current?.bestBlocks ?? Number.POSITIVE_INFINITY, blocks), bestSteps: Math.min(current?.bestSteps ?? Number.POSITIVE_INFINITY, steps) };
  return { version: 1, campaigns: { ...progress.campaigns, [campaignId]: { ...progress.campaigns[campaignId], [challengeId]: result } } };
}
export const loadCampaignProgress = (): CampaignProgress => { try { const parsed = JSON.parse(localStorage.getItem(storageKey) ?? ""); return parsed?.version === 1 && parsed.campaigns && typeof parsed.campaigns === "object" ? parsed : emptyCampaignProgress(); } catch { return emptyCampaignProgress(); } };
export const saveCampaignProgress = (progress: CampaignProgress): void => localStorage.setItem(storageKey, JSON.stringify(progress));
