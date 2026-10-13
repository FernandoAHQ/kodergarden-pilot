import type { PracticeChallengeDefinition } from "@kodergarden/shared";
import type { EditorTool } from "../editor/VisualEditor.js";

export const PRACTICE_GUIDANCE_VERSION = 1;
export const PRACTICE_GUIDANCE_STORAGE_KEY = `kodergarden.guidance.v${PRACTICE_GUIDANCE_VERSION}`;

export type GuidanceTool = EditorTool;
export type GuidanceOutcome = "blocked" | "destination" | "items" | "family" | "efficiency" | "limit" | "general";

export interface GuidanceProgress {
  readonly version: number;
  readonly seen: readonly string[];
  readonly hints: Readonly<Record<string, number>>;
}

export const emptyGuidanceProgress = (): GuidanceProgress => ({
  version: PRACTICE_GUIDANCE_VERSION,
  seen: [],
  hints: {},
});

export function parseGuidanceProgress(value: unknown): GuidanceProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyGuidanceProgress();
  const candidate = value as Partial<GuidanceProgress>;
  if (candidate.version !== PRACTICE_GUIDANCE_VERSION) return emptyGuidanceProgress();
  const seen = Array.isArray(candidate.seen)
    ? [...new Set(candidate.seen.filter((item): item is string => typeof item === "string" && item.length <= 120))].slice(-100)
    : [];
  const hints = candidate.hints && typeof candidate.hints === "object" && !Array.isArray(candidate.hints)
    ? Object.fromEntries(Object.entries(candidate.hints).filter(([key, level]) => key.length <= 160 && Number.isInteger(level) && Number(level) >= 1 && Number(level) <= 4).slice(-100))
    : {};
  return { version: PRACTICE_GUIDANCE_VERSION, seen, hints };
}

export function markGuidanceSeen(progress: GuidanceProgress, key: string): GuidanceProgress {
  if (progress.seen.includes(key)) return progress;
  return { ...progress, seen: [...progress.seen, key].slice(-100) };
}

export function recordHintLevel(progress: GuidanceProgress, key: string, level: number): GuidanceProgress {
  const bounded = Math.min(4, Math.max(1, Math.floor(level)));
  if ((progress.hints[key] ?? 0) >= bounded) return progress;
  return { ...progress, hints: { ...progress.hints, [key]: bounded } };
}

export const containerGuidanceTools: readonly GuidanceTool[] = ["repeat", "if", "ifElse", "while", "repeatUntilGoal"];

export const guidanceToolMeta: Record<GuidanceTool, { readonly icon: string; readonly titleKey: string }> = {
  moveForward: { icon: "↑", titleKey: "editor.moveForward" },
  turn: { icon: "↷", titleKey: "editor.turn" },
  collect: { icon: "✦", titleKey: "editor.collect" },
  repeat: { icon: "↻", titleKey: "editor.repeat" },
  if: { icon: "◇", titleKey: "editor.if" },
  ifElse: { icon: "◇", titleKey: "editor.ifElse" },
  while: { icon: "⟳", titleKey: "editor.while" },
  repeatUntilGoal: { icon: "◎", titleKey: "editor.repeatUntilBattery" },
};

export function unlockGuidanceTool(challenge: PracticeChallengeDefinition): GuidanceTool | null {
  const byUnlock: Record<string, GuidanceTool> = {
    turn: "turn",
    repeat: "repeat",
    if: "if",
    ifElse: "ifElse",
    directions: "ifElse",
    while: "while",
    repeatUntil: "repeatUntilGoal",
  };
  if (challenge.unlockKey && byUnlock[challenge.unlockKey]) return byUnlock[challenge.unlockKey]!;
  if (challenge.allowed.includes("collect")) return "collect";
  return null;
}

export function automaticGuidanceKey(challenge: PracticeChallengeDefinition): string | null {
  if (challenge.assessment?.occasion === "fresh" || challenge.assessment?.occasion === "delayed") return null;
  if (challenge.order === 1) return "orientation";
  const tool = unlockGuidanceTool(challenge);
  if (tool) return `coach:${tool}`;
  if ((challenge.worldVariants?.length ?? 0) > 0) return "family";
  return null;
}

export function guidanceOutcome(input: {
  readonly goal: boolean;
  readonly allItemsCollected: boolean;
  readonly validCollections: boolean;
  readonly passed: number;
  readonly total: number;
  readonly withinBlockLimit: boolean;
  readonly requiredToolsUsed: boolean;
  readonly collisionFree: boolean;
  readonly safetyStop: boolean;
}): GuidanceOutcome {
  if (input.safetyStop) return "limit";
  if (!input.collisionFree) return "blocked";
  if (!input.goal) return "destination";
  if (!input.allItemsCollected || !input.validCollections) return "items";
  if (input.passed < input.total) return "family";
  if (!input.withinBlockLimit || !input.requiredToolsUsed) return "efficiency";
  return "general";
}
