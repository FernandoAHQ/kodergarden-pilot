export interface RuntimeSnapshot {
  readonly completed: boolean;
}

export type RuntimeEffect =
  | { readonly type: "moved"; readonly from: unknown; readonly to: unknown }
  | { readonly type: "turned"; readonly from: string; readonly to: string }
  | { readonly type: "blocked"; readonly reason: "boundary" | "obstacle" }
  | { readonly type: "collected"; readonly objectId: string; readonly position: unknown }
  | { readonly type: "collectFailed"; readonly reason: "no-item" }
  | { readonly type: "worldChanged"; readonly objectId: string; readonly from: unknown; readonly to: unknown; readonly cause: "before-run" };

export interface ProgramRuntime<TSnapshot extends RuntimeSnapshot = RuntimeSnapshot> {
  snapshot(): TSnapshot;
  beginExecution?(): Iterable<RuntimeEffect>;
  moveForward(): RuntimeEffect;
  turnLeft(): RuntimeEffect;
  turnRight(): RuntimeEffect;
  pathOpen(direction: PathDirection): boolean;
  itemPresent(): boolean;
  collect(): RuntimeEffect;
}
import type { PathDirection } from "@kodergarden/language";
