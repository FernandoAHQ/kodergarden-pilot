import { executeProgram, GridRuntime, type GridWorldDefinition } from "@kodergarden/engine";
import { program, programV3, type PathDirection, type Program, type Statement } from "@kodergarden/language";

export type EditorTool = "moveForward" | "turn" | "repeat" | "if" | "ifElse" | "while" | "repeatUntilGoal";
export type CampaignId = string;
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
  readonly maxCollisions?: number;
  readonly requiredTools?: readonly EditorTool[];
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
const corridor = (width: number, height: number, route: readonly { x: number; y: number }[], direction: "north" | "east" | "south" | "west"): GridWorldDefinition => {
  const open = new Set(route.map((cell) => `${cell.x},${cell.y}`));
  const blocked = Array.from({ length: width * height }, (_, index) => ({ x: index % width, y: Math.floor(index / width) })).filter((cell) => !open.has(`${cell.x},${cell.y}`));
  const start = route[0]!; const goal = route.at(-1)!;
  return world(width, height, start.x, start.y, direction, goal.x, goal.y, blocked);
};
const shiftingCorridor = (
  width: number,
  height: number,
  route: readonly { x: number; y: number }[],
  direction: "north" | "east" | "south" | "west",
  shiftingHedges: NonNullable<GridWorldDefinition["shiftingHedges"]>,
): GridWorldDefinition => {
  const base = corridor(width, height, route, direction);
  const railCells = new Set(shiftingHedges.flatMap((hedge) => [`${hedge.from.x},${hedge.from.y}`, `${hedge.to.x},${hedge.to.y}`]));
  return { ...base, blocked: base.blocked.filter((cell) => !railCells.has(`${cell.x},${cell.y}`)), shiftingHedges };
};
const line = (from: number, to: number, fixed: number, axis: "x" | "y") => Array.from({ length: Math.abs(to - from) + 1 }, (_, index) => axis === "x" ? { x: from + Math.sign(to - from) * index, y: fixed } : { x: fixed, y: from + Math.sign(to - from) * index });
const move = (): Statement => ({ type: "moveForward" });
const left = (): Statement => ({ type: "turnLeft" });
const right = (): Statement => ({ type: "turnRight" });
const repeat = (count: number, body: readonly Statement[]): Statement => ({ type: "repeat", count, body });
const ifPath = (body: readonly Statement[]): Statement => ({ type: "if", condition: { type: "pathAhead" }, body });
const path = (direction: PathDirection) => ({ type: "path", direction } as const);
const allTools: readonly EditorTool[] = ["moveForward", "turn", "repeat", "if"];

export function resolveChallengeWorld(challenge: PracticeChallengeDefinition, layoutId: string | null | undefined): GridWorldDefinition {
  return challenge.worldVariants?.find((variant) => variant.id === layoutId)?.world ?? challenge.world;
}

export const challengeWorlds = (challenge: PracticeChallengeDefinition): readonly ChallengeWorldVariant[] => [
  { id: "default", world: challenge.world }, ...(challenge.worldVariants ?? []),
];

export function selectChallengeWorld(challenge: PracticeChallengeDefinition, previousLayoutId: string | null = null, random: () => number = Math.random): SelectedChallengeWorld {
  const variants = challenge.worldVariants;
  if (!variants?.length) return { layoutId: null, world: challenge.world };
  const choices = variants.length > 1 ? variants.filter((variant) => variant.id !== previousLayoutId) : variants;
  const index = Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)));
  const selected = choices[index]!;
  return { layoutId: selected.id, world: selected.world };
}

export const practiceChallenges: readonly PracticeChallengeDefinition[] = [
  { id: "sequence-01", campaignId: "foundations", order: 1, type: "build", titleKey: "c.01.title", instructionKey: "c.01.instruction", conceptKey: "c.01.concept", world: world(4, 3, 0, 1, "east", 2, 1), allowed: ["moveForward"], starter: empty(), maxBlocks: 2, referenceSolution: program([move(), move()]) },
  { id: "sequence-02", campaignId: "foundations", order: 2, type: "build", titleKey: "c.02.title", instructionKey: "c.02.instruction", conceptKey: "c.02.concept", world: world(6, 3, 0, 1, "east", 4, 1), allowed: ["moveForward"], starter: empty(), maxBlocks: 4, referenceSolution: program([move(), move(), move(), move()]) },
  { id: "turn-01", campaignId: "foundations", order: 3, type: "build", titleKey: "c.03.title", instructionKey: "c.03.instruction", conceptKey: "c.03.concept", world: corridor(4, 5, [{x:1,y:4},{x:1,y:3},{x:1,y:2},{x:2,y:2},{x:3,y:2}], "north"), allowed: ["moveForward", "turn"], starter: empty(), maxBlocks: 5, requiredTools:["turn"], unlockKey: "turn", referenceSolution: program([move(),move(),right(),move(),move()]) },
  { id: "turn-02", campaignId: "foundations", order: 4, type: "build", titleKey: "c.04.title", instructionKey: "c.04.instruction", conceptKey: "c.04.concept", world: corridor(5, 5, [{x:0,y:4},{x:1,y:4},{x:2,y:4},{x:2,y:3},{x:2,y:2},{x:3,y:2},{x:4,y:2}], "east"), allowed: ["moveForward", "turn"], starter: empty(), maxBlocks: 8, referenceSolution: program([move(),move(),left(),move(),move(),right(),move(),move()]) },
  { id: "repetition-01", campaignId: "foundations", order: 5, type: "build", titleKey: "c.05.title", instructionKey: "c.05.instruction", conceptKey: "c.05.concept", world: corridor(8, 3, line(0,6,1,"x"), "east"), allowed: ["moveForward", "turn"], starter: empty(), maxBlocks: 6, referenceSolution: program([move(),move(),move(),move(),move(),move()]) },
  { id: "repeat-01", campaignId: "foundations", order: 6, type: "build", titleKey: "c.06.title", instructionKey: "c.06.instruction", conceptKey: "c.06.concept", world: corridor(8, 3, line(0,6,1,"x"), "east"), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 2, requiredTools:["repeat"], unlockKey: "repeat", referenceSolution: program([repeat(6,[move()])]) },
  { id: "repeat-turn", campaignId: "foundations", order: 7, type: "build", titleKey: "c.07.title", instructionKey: "c.07.instruction", conceptKey: "c.07.concept", world: corridor(6, 6, [...line(5,1,1,"y"),...line(2,5,1,"x")], "north"), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 5, referenceSolution: program([repeat(4,[move()]),right(),repeat(4,[move()])]) },
  { id: "efficient", campaignId: "foundations", order: 8, type: "build", titleKey: "c.08.title", instructionKey: "c.08.instruction", conceptKey: "c.08.concept", world: corridor(7, 7, [...line(0,4,5,"x"),...line(5,2,4,"y").slice(1),...line(5,6,2,"x")], "east"), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 8, referenceSolution: program([repeat(4,[move()]),left(),repeat(3,[move()]),right(),repeat(2,[move()])]) },
  { id: "pattern", campaignId: "foundations", order: 9, type: "build", titleKey: "c.09.title", instructionKey: "c.09.instruction", conceptKey: "c.09.concept", world: corridor(5, 6, [{x:0,y:4},{x:1,y:4},{x:1,y:3},{x:2,y:3},{x:2,y:2},{x:3,y:2},{x:3,y:1}], "east"), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 5, referenceSolution: program([repeat(3,[move(),left(),move(),right()])]) },
  { id: "condition-01", campaignId: "foundations", order: 10, type: "build", titleKey: "c.10.title", instructionKey: "c.10.instruction", conceptKey: "c.10.concept", world: corridor(4, 3, [{x:0,y:1},{x:1,y:1}], "east"), allowed: ["moveForward", "if"], starter: empty(), maxBlocks: 2, requiredTools:["if"], unlockKey: "if", referenceSolution: program([ifPath([move()])]) },
  { id: "condition-repeat", campaignId: "foundations", order: 11, type: "build", titleKey: "c.11.title", instructionKey: "c.11.instruction", conceptKey: "c.11.concept", world: corridor(8,3,line(0,2,1,"x"),"east"), worldVariants: [
    { id:"medium", world:corridor(8,3,line(0,4,1,"x"),"east") },
    { id:"long", world:corridor(8,3,line(0,6,1,"x"),"east") },
  ], allowed: ["moveForward", "repeat", "if"], starter: empty(), maxBlocks: 3, referenceSolution: program([repeat(6,[ifPath([move()])])]) },
  { id: "final", campaignId: "foundations", order: 12, type: "build", titleKey: "c.12.title", instructionKey: "c.12.instruction", conceptKey: "c.12.concept", world: corridor(7,7,[...line(1,5,1,"x"),...line(2,5,5,"y")],"east"), worldVariants: [
    { id:"short-long", world:corridor(7,7,[...line(1,3,1,"x"),...line(2,6,3,"y")],"east") },
    { id:"long-short", world:corridor(7,7,[...line(1,6,1,"x"),...line(2,3,6,"y")],"east") },
  ], allowed: allTools, starter: empty(), maxBlocks: 7, referenceSolution: program([repeat(6,[ifPath([move()])]),right(),repeat(6,[ifPath([move()])])]) },
  { id: "if-else", campaignId: "foundations", order: 13, type: "build", titleKey: "c.13.title", instructionKey: "c.13.instruction", conceptKey: "c.13.concept", world: shiftingCorridor(5,6,[{x:1,y:4},{x:1,y:3},{x:1,y:2},{x:1,y:1}],"east",[{id:"choice-hedge",from:{x:2,y:3},to:{x:2,y:4}}]), worldVariants: [
    { id:"one-step-before-turn", world:shiftingCorridor(5,6,[{x:0,y:4},{x:1,y:4},{x:1,y:3},{x:1,y:2}],"east",[{id:"choice-hedge",from:{x:2,y:3},to:{x:2,y:4}}]) },
    { id:"two-steps-before-turn", world:shiftingCorridor(5,6,[{x:0,y:4},{x:1,y:4},{x:2,y:4},{x:2,y:3}],"east",[{id:"choice-hedge",from:{x:3,y:3},to:{x:3,y:4}}]) },
  ], allowed: ["moveForward", "turn", "repeat", "ifElse"], starter: empty(), maxBlocks: 4, requiredTools:["ifElse"], unlockKey: "ifElse", referenceSolution:programV3([repeat(4,[{type:"ifElse",condition:path("ahead"),thenBody:[move()],elseBody:[left()]}])]) },
  { id: "directional-condition", campaignId: "foundations", order: 14, type: "build", titleKey: "c.14.title", instructionKey: "c.14.instruction", conceptKey: "c.14.concept", world: shiftingCorridor(7,5,[{x:3,y:3},{x:2,y:3},{x:1,y:3},{x:0,y:3}],"north",[{id:"direction-hedge",from:{x:4,y:2},to:{x:4,y:3}}]), worldVariants: [
    { id:"right-open", world:shiftingCorridor(7,5,[{x:3,y:3},{x:4,y:3},{x:5,y:3},{x:6,y:3}],"north",[{id:"direction-hedge",from:{x:2,y:2},to:{x:2,y:3}}]) },
  ], allowed: ["moveForward", "turn", "repeat", "ifElse"], starter: empty(), maxBlocks: 5, unlockKey: "directions", referenceSolution: programV3([{ type: "ifElse", condition: path("left"), thenBody: [left()], elseBody: [right()] }, repeat(3, [move()])]) },
  { id: "while-hallway", campaignId: "foundations", order: 15, type: "build", titleKey: "c.15.title", instructionKey: "c.15.instruction", conceptKey: "c.15.concept", world: corridor(3,8,line(7,5,1,"y"),"north"), worldVariants: [
    { id: "medium", world: corridor(3,8,line(7,3,1,"y"),"north") },
    { id: "long", world: corridor(3,8,line(7,1,1,"y"),"north") },
  ], allowed: ["moveForward", "while"], starter: empty(), maxBlocks: 2, requiredTools:["while"], unlockKey: "while", referenceSolution: programV3([{ type: "while", condition: path("ahead"), body: [move()] }]) },
  { id: "repeat-until-battery", campaignId: "foundations", order: 16, type: "build", titleKey: "c.16.title", instructionKey: "c.16.instruction", conceptKey: "c.16.concept", world: shiftingCorridor(7,7,[{x:1,y:5},{x:2,y:5},{x:3,y:5},{x:4,y:5},{x:4,y:4},{x:4,y:3},{x:4,y:2},{x:3,y:2},{x:2,y:2},{x:1,y:2}],"east",[{id:"corner-one",from:{x:5,y:4},to:{x:5,y:5}},{id:"corner-two",from:{x:5,y:1},to:{x:4,y:1}}]), worldVariants: [
    { id:"south-east-north", world:shiftingCorridor(7,7,[{x:1,y:1},{x:1,y:2},{x:1,y:3},{x:1,y:4},{x:2,y:4},{x:3,y:4},{x:4,y:4},{x:4,y:3},{x:4,y:2},{x:4,y:1}],"south",[{id:"corner-one",from:{x:0,y:5},to:{x:1,y:5}},{id:"corner-two",from:{x:5,y:5},to:{x:5,y:4}}]) },
    { id:"north-west-south", world:shiftingCorridor(7,7,[{x:5,y:5},{x:5,y:4},{x:5,y:3},{x:5,y:2},{x:4,y:2},{x:3,y:2},{x:2,y:2},{x:2,y:3},{x:2,y:4},{x:2,y:5}],"north",[{id:"corner-one",from:{x:6,y:1},to:{x:5,y:1}},{id:"corner-two",from:{x:1,y:1},to:{x:1,y:2}}]) },
  ], allowed: ["moveForward", "turn", "ifElse", "repeatUntilGoal"], starter: empty(), maxBlocks: 4, requiredTools:["repeatUntilGoal"], unlockKey: "repeatUntil", referenceSolution: programV3([{ type: "repeatUntilGoal", body: [{ type: "ifElse", condition: path("ahead"), thenBody: [move()], elseBody: [left()] }] }]) },
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

const toolForStatement = (statement: Statement): EditorTool => statement.type === "turnLeft" || statement.type === "turnRight" ? "turn" : statement.type;
const programUsesTool = (statements: readonly Statement[], tool: EditorTool): boolean => statements.some((statement) => toolForStatement(statement) === tool || (statement.type === "repeat" || statement.type === "if" || statement.type === "while" || statement.type === "repeatUntilGoal") && programUsesTool(statement.body, tool) || statement.type === "ifElse" && (programUsesTool(statement.thenBody, tool) || programUsesTool(statement.elseBody, tool)));
const collisionsIn = (events: ReturnType<typeof executeProgram>["events"]): number => events.filter((event) => event.type === "runtimeEffect" && event.effect.type === "blocked").length;

export interface ChallengeLayoutEvaluation { readonly id: string; readonly succeeded: boolean; readonly collisions: number; readonly executionSteps: number }
export interface ChallengeProgramEvaluation {
  readonly complete: boolean; readonly goalReached: boolean; readonly withinBlockLimit: boolean; readonly requiredToolsUsed: boolean; readonly collisionFree: boolean;
  readonly blocks: number; readonly layouts: readonly ChallengeLayoutEvaluation[]; readonly firstFailingLayoutId: string | null;
}

export function evaluatePracticeProgram(challenge: PracticeChallengeDefinition, candidate: Program, blocks: number): ChallengeProgramEvaluation {
  const layouts = challengeWorlds(challenge).map(({id,world}) => { const result=executeProgram(candidate,new GridRuntime(world)); return { id, succeeded:result.succeeded, collisions:collisionsIn(result.events), executionSteps:result.executionSteps }; });
  const withinBlockLimit=challenge.maxBlocks===undefined||blocks<=challenge.maxBlocks;
  const requiredToolsUsed=(challenge.requiredTools??[]).every((tool)=>programUsesTool(candidate.statements,tool));
  const collisionLimit=challenge.maxCollisions??(challenge.campaignId==="foundations"?0:Number.POSITIVE_INFINITY);
  const collisionFree=layouts.every((layout)=>layout.collisions<=collisionLimit);
  const goalReached=layouts.every((layout)=>layout.succeeded);
  const firstFailingLayoutId=layouts.find((layout)=>!layout.succeeded||layout.collisions>collisionLimit)?.id??null;
  return { complete:goalReached&&withinBlockLimit&&requiredToolsUsed&&collisionFree, goalReached, withinBlockLimit, requiredToolsUsed, collisionFree, blocks, layouts, firstFailingLayoutId };
}

export function evaluateLiveProgram(challenge: PracticeChallengeDefinition, candidate: Program, blocks: number, activeWorld: GridWorldDefinition): ChallengeProgramEvaluation {
  const result=executeProgram(candidate,new GridRuntime(activeWorld)); const collisions=collisionsIn(result.events);
  const withinBlockLimit=challenge.campaignId==="garden-expedition"||challenge.maxBlocks===undefined||blocks<=challenge.maxBlocks;
  const requiredToolsUsed=(challenge.requiredTools??[]).every((tool)=>programUsesTool(candidate.statements,tool));
  const collisionLimit=challenge.maxCollisions??(challenge.campaignId==="foundations"?0:Number.POSITIVE_INFINITY);
  const collisionFree=collisions<=collisionLimit; const complete=result.succeeded&&withinBlockLimit&&requiredToolsUsed&&collisionFree;
  return { complete,goalReached:result.succeeded,withinBlockLimit,requiredToolsUsed,collisionFree,blocks,layouts:[{id:"active",succeeded:result.succeeded,collisions,executionSteps:result.executionSteps}],firstFailingLayoutId:complete?null:"active" };
}

export function statementAllowed(statement: Statement, allowed: readonly EditorTool[]): boolean {
  const own = statement.type === "moveForward" ? "moveForward" : statement.type === "turnLeft" || statement.type === "turnRight" ? "turn" : statement.type === "repeat" ? "repeat" : statement.type;
  if (!allowed.includes(own)) return false;
  if (statement.type === "repeat" || statement.type === "if" || statement.type === "while" || statement.type === "repeatUntilGoal") return statement.body.every((child) => statementAllowed(child, allowed));
  if (statement.type === "ifElse") return [...statement.thenBody, ...statement.elseBody].every((child) => statementAllowed(child, allowed));
  return true;
}
