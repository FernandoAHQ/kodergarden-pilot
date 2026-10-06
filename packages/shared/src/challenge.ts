import type { GridWorldDefinition } from "@kodergarden/engine";
import type { Program, Statement } from "@kodergarden/language";

export type ActivityType = "build" | "debug" | "predict";
export type InstructionType = Statement["type"];

export interface Challenge {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type: ActivityType;
  readonly world: GridWorldDefinition;
  readonly allowedInstructions: readonly InstructionType[];
  readonly starterProgram?: Program;
  readonly constraints?: { readonly maxBlocks?: number };
}
