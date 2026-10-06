import type { GridWorldDefinition } from "@kodergarden/engine";
import { program, type Program } from "@kodergarden/language";

export interface SimulationSample {
  readonly id: string;
  readonly title: string;
  readonly instruction: string;
  readonly concept: string;
  readonly world: GridWorldDefinition;
  readonly program: Program;
}

export const samples: readonly SimulationSample[] = [
  {
    id: "first-steps",
    title: "First Steps",
    instruction: "Help Pip cross the garden path and reach the battery.",
    concept: "Sequence",
    world: { width: 6, height: 5, blocked: [{ x: 2, y: 1 }, { x: 4, y: 3 }], robot: { x: 0, y: 2, direction: "east" }, goal: { x: 4, y: 2 } },
    program: program([{ type: "moveForward" }, { type: "moveForward" }, { type: "moveForward" }, { type: "moveForward" }]),
  },
  {
    id: "turn-corner",
    title: "Turn the Corner",
    instruction: "Follow the bend to reach the battery behind the hedge.",
    concept: "Sequence + turns",
    world: { width: 6, height: 5, blocked: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 3 }, { x: 4, y: 3 }], robot: { x: 0, y: 3, direction: "east" }, goal: { x: 2, y: 1 } },
    program: program([{ type: "moveForward" }, { type: "moveForward" }, { type: "turnLeft" }, { type: "moveForward" }, { type: "moveForward" }]),
  },
  {
    id: "repeat-run",
    title: "The Long Garden",
    instruction: "Use a repeat loop to cover the long path efficiently.",
    concept: "Repeat",
    world: { width: 7, height: 5, blocked: [{ x: 1, y: 1 }, { x: 3, y: 3 }, { x: 5, y: 1 }], robot: { x: 0, y: 2, direction: "east" }, goal: { x: 5, y: 2 } },
    program: program([{ type: "repeat", count: 5, body: [{ type: "moveForward" }] }]),
  },
  {
    id: "wall-bump",
    title: "A Wall in the Way",
    instruction: "Watch what happens when Pip tries to move through a stone wall.",
    concept: "Collision",
    world: { width: 6, height: 5, blocked: [{ x: 3, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 3 }], robot: { x: 1, y: 2, direction: "east" }, goal: { x: 5, y: 2 } },
    program: program([{ type: "moveForward" }, { type: "moveForward" }, { type: "moveForward" }]),
  },
  {
    id: "look-ahead",
    title: "Look Before You Move",
    instruction: "Pip checks the path before taking a step toward the battery.",
    concept: "If / Path ahead",
    world: { width: 6, height: 5, blocked: [{ x: 2, y: 1 }, { x: 2, y: 3 }], robot: { x: 1, y: 2, direction: "east" }, goal: { x: 2, y: 2 } },
    program: program([{ type: "if", condition: { type: "pathAhead" }, body: [{ type: "moveForward" }] }]),
  },
];
