import type { ProgramRuntime, RuntimeEffect, RuntimeSnapshot } from "./runtime.js";

export type Direction = "north" | "east" | "south" | "west";
export interface Position { readonly x: number; readonly y: number }
export interface GridWorldDefinition {
  readonly width: number;
  readonly height: number;
  readonly blocked: readonly Position[];
  readonly robot: Position & { readonly direction: Direction };
  readonly goal: Position;
}
export interface GridSnapshot extends RuntimeSnapshot {
  readonly robot: Position & { readonly direction: Direction };
  readonly goal: Position;
}

const directions: readonly Direction[] = ["north", "east", "south", "west"];
const delta: Record<Direction, Position> = {
  north: { x: 0, y: -1 }, east: { x: 1, y: 0 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 },
};
const key = ({ x, y }: Position): string => `${x},${y}`;

export class GridRuntime implements ProgramRuntime<GridSnapshot> {
  private robot: Position & { direction: Direction };
  private readonly blocked: ReadonlySet<string>;

  constructor(private readonly world: GridWorldDefinition) {
    if (!Number.isInteger(world.width) || !Number.isInteger(world.height) || world.width < 1 || world.height < 1) throw new Error("Grid dimensions must be positive integers");
    this.assertInside(world.robot, "robot");
    this.assertInside(world.goal, "goal");
    this.blocked = new Set(world.blocked.map((cell) => { this.assertInside(cell, "blocked cell"); return key(cell); }));
    if (this.blocked.has(key(world.robot)) || this.blocked.has(key(world.goal))) throw new Error("Robot and goal must be on open cells");
    this.robot = { ...world.robot };
  }

  snapshot(): GridSnapshot {
    return { robot: { ...this.robot }, goal: { ...this.world.goal }, completed: key(this.robot) === key(this.world.goal) };
  }
  moveForward(): RuntimeEffect {
    const change = delta[this.robot.direction];
    const to = { x: this.robot.x + change.x, y: this.robot.y + change.y };
    const reason = this.blockReason(to);
    if (reason) return { type: "blocked", reason };
    const from = { x: this.robot.x, y: this.robot.y };
    this.robot = { ...to, direction: this.robot.direction };
    return { type: "moved", from, to };
  }
  turnLeft(): RuntimeEffect { return this.turn(-1); }
  turnRight(): RuntimeEffect { return this.turn(1); }
  pathAhead(): boolean {
    const change = delta[this.robot.direction];
    return this.blockReason({ x: this.robot.x + change.x, y: this.robot.y + change.y }) === undefined;
  }
  private turn(offset: number): RuntimeEffect {
    const from = this.robot.direction;
    const index = (directions.indexOf(from) + offset + directions.length) % directions.length;
    const to = directions[index]!;
    this.robot = { ...this.robot, direction: to };
    return { type: "turned", from, to };
  }
  private blockReason(position: Position): "boundary" | "obstacle" | undefined {
    if (position.x < 0 || position.y < 0 || position.x >= this.world.width || position.y >= this.world.height) return "boundary";
    return this.blocked.has(key(position)) ? "obstacle" : undefined;
  }
  private assertInside(position: Position, label: string): void {
    if (!Number.isInteger(position.x) || !Number.isInteger(position.y) || position.x < 0 || position.y < 0 || position.x >= this.world.width || position.y >= this.world.height) throw new Error(`${label} must be inside the grid`);
  }
}
