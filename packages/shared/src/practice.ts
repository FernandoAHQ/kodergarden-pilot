import type { GridWorldDefinition } from "@kodergarden/engine";
import { program, type Program, type Statement } from "@kodergarden/language";

export type EditorTool = "moveForward" | "turn" | "repeat" | "ifPathAhead" | "ifElsePathAhead";
export type CampaignId = "foundations" | "garden-expedition";
export type CampaignKind = "guided" | "advanced";

export interface ChallengeWorldVariant {
  readonly id: string;
  readonly world: GridWorldDefinition;
}

export interface SelectedChallengeWorld {
  readonly layoutId: string | null;
  readonly world: GridWorldDefinition;
}

export interface PracticeChallengeDefinition {
  readonly id: string;
  readonly campaignId: CampaignId;
  readonly order: number;
  readonly type: "build";
  readonly titleKey: string;
  readonly instructionKey: string;
  readonly conceptKey: string;
  readonly world: GridWorldDefinition;
  readonly worldVariants?: readonly ChallengeWorldVariant[];
  readonly allowed: readonly EditorTool[];
  readonly starter: Program;
  readonly maxBlocks?: number;
  readonly parBlocks?: number;
  readonly parSteps?: number;
  readonly unlockKey?: string;
  readonly referenceSolution?: Program;
}

export interface CampaignDefinition {
  readonly id: CampaignId;
  readonly order: number;
  readonly kind: CampaignKind;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly challenges: readonly PracticeChallengeDefinition[];
}

const empty = (): Program => program([]);
const world = (width: number, height: number, x: number, y: number, direction: "north" | "east" | "south" | "west", goalX: number, goalY: number, blocked: readonly { x: number; y: number }[] = []): GridWorldDefinition => ({ width, height, blocked, robot: { x, y, direction }, goal: { x: goalX, y: goalY } });
const move = (): Statement => ({ type: "moveForward" });
const left = (): Statement => ({ type: "turnLeft" });
const right = (): Statement => ({ type: "turnRight" });
const repeat = (count: number, body: readonly Statement[]): Statement => ({ type: "repeat", count, body });
const ifPath = (body: readonly Statement[]): Statement => ({ type: "if", condition: { type: "pathAhead" }, body });
const allTools: readonly EditorTool[] = ["moveForward", "turn", "repeat", "ifPathAhead"];

export function resolveChallengeWorld(challenge: PracticeChallengeDefinition, layoutId: string | null | undefined): GridWorldDefinition {
  return challenge.worldVariants?.find((variant) => variant.id === layoutId)?.world ?? challenge.world;
}

export function selectChallengeWorld(challenge: PracticeChallengeDefinition, previousLayoutId: string | null = null, random: () => number = Math.random): SelectedChallengeWorld {
  const variants = challenge.worldVariants;
  if (!variants?.length) return { layoutId: null, world: challenge.world };
  const choices = variants.length > 1 ? variants.filter((variant) => variant.id !== previousLayoutId) : variants;
  const index = Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)));
  const selected = choices[index]!;
  return { layoutId: selected.id, world: selected.world };
}

export const practiceChallenges: readonly PracticeChallengeDefinition[] = [
  { id: "sequence-01", campaignId: "foundations", order: 1, type: "build", titleKey: "c.01.title", instructionKey: "c.01.instruction", conceptKey: "c.01.concept", world: world(5, 4, 0, 2, "east", 2, 2), allowed: ["moveForward"], starter: empty() },
  { id: "sequence-02", campaignId: "foundations", order: 2, type: "build", titleKey: "c.02.title", instructionKey: "c.02.instruction", conceptKey: "c.02.concept", world: world(6, 4, 0, 2, "east", 4, 2), allowed: ["moveForward"], starter: empty() },
  { id: "turn-01", campaignId: "foundations", order: 3, type: "build", titleKey: "c.03.title", instructionKey: "c.03.instruction", conceptKey: "c.03.concept", world: world(5, 5, 1, 3, "east", 3, 1), allowed: ["moveForward", "turn"], starter: empty(), unlockKey: "turn" },
  { id: "turn-02", campaignId: "foundations", order: 4, type: "build", titleKey: "c.04.title", instructionKey: "c.04.instruction", conceptKey: "c.04.concept", world: world(6, 5, 0, 4, "east", 4, 1, [{ x: 3, y: 3 }]), allowed: ["moveForward", "turn"], starter: empty() },
  { id: "repetition-01", campaignId: "foundations", order: 5, type: "build", titleKey: "c.05.title", instructionKey: "c.05.instruction", conceptKey: "c.05.concept", world: world(8, 3, 0, 1, "east", 6, 1), allowed: ["moveForward", "turn"], starter: empty() },
  { id: "repeat-01", campaignId: "foundations", order: 6, type: "build", titleKey: "c.06.title", instructionKey: "c.06.instruction", conceptKey: "c.06.concept", world: world(8, 3, 0, 1, "east", 6, 1), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 3, unlockKey: "repeat" },
  { id: "repeat-turn", campaignId: "foundations", order: 7, type: "build", titleKey: "c.07.title", instructionKey: "c.07.instruction", conceptKey: "c.07.concept", world: world(7, 6, 1, 4, "east", 5, 2), allowed: ["moveForward", "turn", "repeat"], starter: empty() },
  { id: "efficient", campaignId: "foundations", order: 8, type: "build", titleKey: "c.08.title", instructionKey: "c.08.instruction", conceptKey: "c.08.concept", world: world(7, 5, 0, 3, "east", 5, 1), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 6 },
  { id: "pattern", campaignId: "foundations", order: 9, type: "build", titleKey: "c.09.title", instructionKey: "c.09.instruction", conceptKey: "c.09.concept", world: world(6, 6, 1, 4, "east", 4, 1), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 6 },
  { id: "condition-01", campaignId: "foundations", order: 10, type: "build", titleKey: "c.10.title", instructionKey: "c.10.instruction", conceptKey: "c.10.concept", world: world(5, 3, 0, 1, "east", 3, 1, [{ x: 4, y: 1 }]), allowed: ["moveForward", "repeat", "ifPathAhead"], starter: empty(), maxBlocks: 4, unlockKey: "if" },
  { id: "condition-repeat", campaignId: "foundations", order: 11, type: "build", titleKey: "c.11.title", instructionKey: "c.11.instruction", conceptKey: "c.11.concept", world: world(6, 3, 0, 1, "east", 5, 1), allowed: ["moveForward", "repeat", "ifPathAhead"], starter: empty(), maxBlocks: 4 },
  { id: "final", campaignId: "foundations", order: 12, type: "build", titleKey: "c.12.title", instructionKey: "c.12.instruction", conceptKey: "c.12.concept", world: world(7, 6, 1, 4, "east", 5, 1, [{ x: 3, y: 3 }, { x: 4, y: 3 }]), allowed: allTools, starter: empty(), maxBlocks: 9 },
  { id: "if-else", campaignId: "foundations", order: 13, type: "build", titleKey: "c.13.title", instructionKey: "c.13.instruction", conceptKey: "c.13.concept", world: world(5, 5, 1, 3, "east", 1, 1, [{ x: 2, y: 3 }]), worldVariants: [
    { id: "turn-north", world: world(5, 5, 1, 3, "east", 1, 1, [{ x: 2, y: 3 }]) },
    { id: "turn-west", world: world(5, 5, 3, 3, "north", 1, 3, [{ x: 3, y: 2 }]) },
    { id: "turn-south", world: world(5, 5, 3, 1, "west", 3, 3, [{ x: 2, y: 1 }]) },
    { id: "turn-east", world: world(5, 5, 1, 1, "south", 3, 1, [{ x: 1, y: 2 }]) },
  ], allowed: ["moveForward", "turn", "repeat", "ifElsePathAhead"], starter: empty(), maxBlocks: 4, unlockKey: "ifElse" },
];

export const gardenExpeditionChallenges: readonly PracticeChallengeDefinition[] = [
  { id: "expedition-winding-path", campaignId: "garden-expedition", order: 1, type: "build", titleKey: "exp.01.title", instructionKey: "exp.01.instruction", conceptKey: "exp.01.concept", world: world(7, 7, 1, 5, "east", 5, 1, [{x:3,y:3},{x:4,y:3}]), allowed: allTools, starter: empty(), parBlocks: 5, parSteps: 9, referenceSolution: program([repeat(4,[move()]),left(),repeat(4,[move()])]) },
  { id: "expedition-twin-corridors", campaignId: "garden-expedition", order: 2, type: "build", titleKey: "exp.02.title", instructionKey: "exp.02.instruction", conceptKey: "exp.02.concept", world: world(8, 7, 0, 5, "north", 6, 1, [{x:2,y:2},{x:3,y:2},{x:4,y:2}]), allowed: allTools, starter: empty(), parBlocks: 5, parSteps: 11, referenceSolution: program([repeat(4,[move()]),right(),repeat(6,[move()])]) },
  { id: "expedition-spiral-garden", campaignId: "garden-expedition", order: 3, type: "build", titleKey: "exp.03.title", instructionKey: "exp.03.instruction", conceptKey: "exp.03.concept", world: world(7, 7, 1, 5, "east", 3, 3, [{x:4,y:4},{x:4,y:3}]), allowed: allTools, starter: empty(), parBlocks: 4, parSteps: 6, referenceSolution: program([repeat(2,[repeat(2,[move()]),left()])]) },
  { id: "expedition-gate-check", campaignId: "garden-expedition", order: 4, type: "build", titleKey: "exp.04.title", instructionKey: "exp.04.instruction", conceptKey: "exp.04.concept", world: world(6, 5, 0, 2, "east", 5, 2), allowed: allTools, starter: empty(), parBlocks: 3, parSteps: 5, referenceSolution: program([repeat(8,[ifPath([move()])])]) },
  { id: "expedition-patrol-route", campaignId: "garden-expedition", order: 5, type: "build", titleKey: "exp.05.title", instructionKey: "exp.05.instruction", conceptKey: "exp.05.concept", world: world(8, 7, 1, 5, "east", 5, 1, [{x:2,y:3},{x:3,y:3},{x:4,y:3}]), allowed: allTools, starter: empty(), parBlocks: 7, parSteps: 9, referenceSolution: program([repeat(4,[ifPath([move()])]),left(),repeat(4,[ifPath([move()])])]) },
  { id: "expedition-nested-trail", campaignId: "garden-expedition", order: 6, type: "build", titleKey: "exp.06.title", instructionKey: "exp.06.instruction", conceptKey: "exp.06.concept", world: world(7, 7, 1, 1, "east", 3, 3, [{x:4,y:2},{x:2,y:4}]), allowed: allTools, starter: empty(), parBlocks: 4, parSteps: 6, referenceSolution: program([repeat(2,[repeat(2,[move()]),right()])]) },
  { id: "expedition-detour", campaignId: "garden-expedition", order: 7, type: "build", titleKey: "exp.07.title", instructionKey: "exp.07.instruction", conceptKey: "exp.07.concept", world: world(7, 7, 1, 5, "east", 5, 1, [{x:3,y:2},{x:3,y:3},{x:3,y:4},{x:3,y:5}]), allowed: allTools, starter: empty(), parBlocks: 6, parSteps: 10, referenceSolution: program([left(),repeat(4,[move()]),right(),repeat(4,[move()])]) },
  { id: "expedition-summit", campaignId: "garden-expedition", order: 8, type: "build", titleKey: "exp.08.title", instructionKey: "exp.08.instruction", conceptKey: "exp.08.concept", world: world(8, 8, 1, 5, "east", 4, 2, [{x:5,y:4},{x:5,y:5},{x:2,y:2}]), allowed: allTools, starter: empty(), parBlocks: 4, parSteps: 8, referenceSolution: program([repeat(2,[repeat(3,[move()]),left()])]) },
];

export const campaigns: readonly CampaignDefinition[] = [
  { id: "foundations", order: 1, kind: "guided", titleKey: "campaign.foundations.title", descriptionKey: "campaign.foundations.description", challenges: practiceChallenges },
  { id: "garden-expedition", order: 2, kind: "advanced", titleKey: "campaign.expedition.title", descriptionKey: "campaign.expedition.description", challenges: gardenExpeditionChallenges },
];
export const allChallenges = campaigns.flatMap((campaign) => campaign.challenges);
export const getCampaign = (id: string): CampaignDefinition | undefined => campaigns.find((campaign) => campaign.id === id);
export const getChallenge = (id: string): PracticeChallengeDefinition | undefined => allChallenges.find((challenge) => challenge.id === id);
export const getPracticeChallenge = getChallenge;
export const challengeBelongsToCampaign = (campaignId: string, challengeId: string): boolean => getCampaign(campaignId)?.challenges.some((challenge) => challenge.id === challengeId) ?? false;
export const evaluatePracticeChallenge = (challenge: PracticeChallengeDefinition, succeeded: boolean, blocks: number) => ({ goalReached: succeeded, withinBlockLimit: challenge.maxBlocks === undefined || blocks <= challenge.maxBlocks, complete: succeeded && (challenge.maxBlocks === undefined || blocks <= challenge.maxBlocks) });
export const evaluateLiveChallenge = (challenge: PracticeChallengeDefinition, succeeded: boolean, blocks: number) => challenge.campaignId === "garden-expedition" ? { goalReached: succeeded, withinBlockLimit: true, complete: succeeded } : evaluatePracticeChallenge(challenge, succeeded, blocks);

export function statementAllowed(statement: Statement, allowed: readonly EditorTool[]): boolean {
  const own = statement.type === "moveForward" ? "moveForward" : statement.type === "turnLeft" || statement.type === "turnRight" ? "turn" : statement.type === "repeat" ? "repeat" : statement.type === "if" ? "ifPathAhead" : "ifElsePathAhead";
  if (!allowed.includes(own)) return false;
  if (statement.type === "repeat" || statement.type === "if") return statement.body.every((child) => statementAllowed(child, allowed));
  if (statement.type === "ifElse") return [...statement.thenBody, ...statement.elseBody].every((child) => statementAllowed(child, allowed));
  return true;
}
