import type { PathDirection } from "@kodergarden/language";
import type { ProgramRuntime, RuntimeEffect, RuntimeSnapshot } from "./runtime.js";

export type Direction = "north" | "east" | "south" | "west";
export interface Position { readonly x: number; readonly y: number }
export interface GridWorldDefinition {
  readonly width: number;
  readonly height: number;
  readonly blocked: readonly Position[];
  readonly shiftingHedges?: readonly { readonly id: string; readonly from: Position; readonly to: Position }[];
  readonly robot: Position & { readonly direction: Direction };
  readonly goal: Position;
}
export interface GridSnapshot extends RuntimeSnapshot {
  readonly robot: Position & { readonly direction: Direction };
  readonly goal: Position;
  readonly shiftingHedges?: readonly { readonly id: string; readonly position: Position }[];
}

const directions: readonly Direction[] = ["north", "east", "south", "west"];
const delta: Record<Direction, Position> = {
  north: { x: 0, y: -1 }, east: { x: 1, y: 0 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 },
};
const key = ({ x, y }: Position): string => `${x},${y}`;

export class GridRuntime implements ProgramRuntime<GridSnapshot> {
  private robot: Position & { direction: Direction };
  private readonly blocked: Set<string>;
  private shiftingHedges: { readonly id: string; position: Position; readonly to: Position }[];

  constructor(private readonly world: GridWorldDefinition) {
    if (!Number.isInteger(world.width) || !Number.isInteger(world.height) || world.width < 1 || world.height < 1) throw new Error("Grid dimensions must be positive integers");
    this.assertInside(world.robot, "robot");
    this.assertInside(world.goal, "goal");
    this.blocked = new Set(world.blocked.map((cell) => { this.assertInside(cell, "blocked cell"); return key(cell); }));
    this.shiftingHedges=(world.shiftingHedges??[]).map((hedge)=>{this.assertInside(hedge.from,"shifting hedge start");this.assertInside(hedge.to,"shifting hedge target");if(hedge.id.trim().length===0)throw new Error("Shifting hedge id must not be empty");if(key(hedge.from)===key(hedge.to))throw new Error("Shifting hedge movement must change position");if(this.blocked.has(key(hedge.from))||this.blocked.has(key(hedge.to)))throw new Error("Shifting hedges must use open rail cells");return {id:hedge.id,position:{...hedge.from},to:{...hedge.to}};});
    const ids=new Set<string>(); const dynamicStarts=new Set<string>(); const dynamicTargets=new Set<string>();
    for(const hedge of this.shiftingHedges){if(ids.has(hedge.id))throw new Error("Shifting hedge ids must be unique");if(dynamicStarts.has(key(hedge.position))||dynamicTargets.has(key(hedge.to)))throw new Error("Shifting hedge positions must be unique");ids.add(hedge.id);dynamicStarts.add(key(hedge.position));dynamicTargets.add(key(hedge.to));}
    for(const position of dynamicStarts)if(dynamicTargets.has(position))throw new Error("Shifting hedge rails cannot overlap");
    for(const hedge of this.shiftingHedges)this.blocked.add(key(hedge.position));
    if (this.blocked.has(key(world.robot)) || this.blocked.has(key(world.goal))) throw new Error("Robot and goal must be on open cells");
    if(dynamicTargets.has(key(world.robot))||dynamicTargets.has(key(world.goal)))throw new Error("Shifting hedges cannot move onto the robot or goal");
    this.robot = { ...world.robot };
  }

  snapshot(): GridSnapshot {
    return { robot: { ...this.robot }, goal: { ...this.world.goal }, shiftingHedges:this.shiftingHedges.map((hedge)=>({id:hedge.id,position:{...hedge.position}})), completed: key(this.robot) === key(this.world.goal) };
  }
  beginExecution(): readonly RuntimeEffect[] {
    const effects: RuntimeEffect[]=[];
    for(const hedge of this.shiftingHedges){const from={...hedge.position};this.blocked.delete(key(from));if(this.blocked.has(key(hedge.to)))throw new Error("Shifting hedge target must be open when movement begins");hedge.position={...hedge.to};this.blocked.add(key(hedge.position));effects.push({type:"worldChanged",objectId:hedge.id,from,to:{...hedge.position},cause:"before-run"});}
    return effects;
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
  pathOpen(relative: PathDirection): boolean {
    const offset = relative === "left" ? -1 : relative === "right" ? 1 : 0;
    const direction = directions[(directions.indexOf(this.robot.direction) + offset + directions.length) % directions.length]!;
    const change = delta[direction];
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
