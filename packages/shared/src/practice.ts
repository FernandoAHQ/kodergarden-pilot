import type { GridWorldDefinition } from "@kodergarden/engine";
import { program, type Program, type Statement } from "@kodergarden/language";

export type EditorTool = "moveForward" | "turn" | "repeat" | "ifPathAhead";

export interface PracticeChallengeDefinition {
  readonly id: string;
  readonly order: number;
  readonly type: "build";
  readonly titleKey: string;
  readonly instructionKey: string;
  readonly conceptKey: string;
  readonly world: GridWorldDefinition;
  readonly allowed: readonly EditorTool[];
  readonly starter: Program;
  readonly maxBlocks?: number;
  readonly unlockKey?: string;
}

const empty = (): Program => program([]);
const world = (width: number, height: number, x: number, y: number, direction: "north" | "east" | "south" | "west", goalX: number, goalY: number, blocked: readonly { x: number; y: number }[] = []): GridWorldDefinition => ({ width, height, blocked, robot: { x, y, direction }, goal: { x: goalX, y: goalY } });

export const practiceChallenges: readonly PracticeChallengeDefinition[] = [
  { id: "sequence-01", order: 1, type: "build", titleKey: "c.01.title", instructionKey: "c.01.instruction", conceptKey: "c.01.concept", world: world(5, 4, 0, 2, "east", 2, 2), allowed: ["moveForward"], starter: empty() },
  { id: "sequence-02", order: 2, type: "build", titleKey: "c.02.title", instructionKey: "c.02.instruction", conceptKey: "c.02.concept", world: world(6, 4, 0, 2, "east", 4, 2), allowed: ["moveForward"], starter: empty() },
  { id: "turn-01", order: 3, type: "build", titleKey: "c.03.title", instructionKey: "c.03.instruction", conceptKey: "c.03.concept", world: world(5, 5, 1, 3, "east", 3, 1), allowed: ["moveForward", "turn"], starter: empty(), unlockKey: "turn" },
  { id: "turn-02", order: 4, type: "build", titleKey: "c.04.title", instructionKey: "c.04.instruction", conceptKey: "c.04.concept", world: world(6, 5, 0, 4, "east", 4, 1, [{ x: 3, y: 3 }]), allowed: ["moveForward", "turn"], starter: empty() },
  { id: "repetition-01", order: 5, type: "build", titleKey: "c.05.title", instructionKey: "c.05.instruction", conceptKey: "c.05.concept", world: world(8, 3, 0, 1, "east", 6, 1), allowed: ["moveForward", "turn"], starter: empty() },
  { id: "repeat-01", order: 6, type: "build", titleKey: "c.06.title", instructionKey: "c.06.instruction", conceptKey: "c.06.concept", world: world(8, 3, 0, 1, "east", 6, 1), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 3, unlockKey: "repeat" },
  { id: "repeat-turn", order: 7, type: "build", titleKey: "c.07.title", instructionKey: "c.07.instruction", conceptKey: "c.07.concept", world: world(7, 6, 1, 4, "east", 5, 2), allowed: ["moveForward", "turn", "repeat"], starter: empty() },
  { id: "efficient", order: 8, type: "build", titleKey: "c.08.title", instructionKey: "c.08.instruction", conceptKey: "c.08.concept", world: world(7, 5, 0, 3, "east", 5, 1), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 6 },
  { id: "pattern", order: 9, type: "build", titleKey: "c.09.title", instructionKey: "c.09.instruction", conceptKey: "c.09.concept", world: world(6, 6, 1, 4, "east", 4, 1), allowed: ["moveForward", "turn", "repeat"], starter: empty(), maxBlocks: 6 },
  { id: "condition-01", order: 10, type: "build", titleKey: "c.10.title", instructionKey: "c.10.instruction", conceptKey: "c.10.concept", world: world(5, 3, 0, 1, "east", 3, 1, [{ x: 4, y: 1 }]), allowed: ["moveForward", "repeat", "ifPathAhead"], starter: empty(), maxBlocks: 4, unlockKey: "if" },
  { id: "condition-repeat", order: 11, type: "build", titleKey: "c.11.title", instructionKey: "c.11.instruction", conceptKey: "c.11.concept", world: world(6, 3, 0, 1, "east", 5, 1), allowed: ["moveForward", "repeat", "ifPathAhead"], starter: empty(), maxBlocks: 4 },
  { id: "final", order: 12, type: "build", titleKey: "c.12.title", instructionKey: "c.12.instruction", conceptKey: "c.12.concept", world: world(7, 6, 1, 4, "east", 5, 1, [{ x: 3, y: 3 }, { x: 4, y: 3 }]), allowed: ["moveForward", "turn", "repeat", "ifPathAhead"], starter: empty(), maxBlocks: 9 },
];

export const getPracticeChallenge = (id: string): PracticeChallengeDefinition | undefined => practiceChallenges.find((challenge) => challenge.id === id);
export const evaluatePracticeChallenge = (challenge: PracticeChallengeDefinition, succeeded: boolean, blocks: number) => ({ goalReached: succeeded, withinBlockLimit: challenge.maxBlocks === undefined || blocks <= challenge.maxBlocks, complete: succeeded && (challenge.maxBlocks === undefined || blocks <= challenge.maxBlocks) });

export function statementAllowed(statement: Statement, allowed: readonly EditorTool[]): boolean {
  const own = statement.type === "moveForward" ? "moveForward" : statement.type === "turnLeft" || statement.type === "turnRight" ? "turn" : statement.type === "repeat" ? "repeat" : "ifPathAhead";
  return allowed.includes(own) && (statement.type !== "repeat" && statement.type !== "if" || statement.body.every((child) => statementAllowed(child, allowed)));
}
