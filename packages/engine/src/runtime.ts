export interface RuntimeSnapshot {
  readonly completed: boolean;
}

export type RuntimeEffect =
  | { readonly type: "moved"; readonly from: unknown; readonly to: unknown }
  | { readonly type: "turned"; readonly from: string; readonly to: string }
  | { readonly type: "blocked"; readonly reason: "boundary" | "obstacle" };

export interface ProgramRuntime<TSnapshot extends RuntimeSnapshot = RuntimeSnapshot> {
  snapshot(): TSnapshot;
  moveForward(): RuntimeEffect;
  turnLeft(): RuntimeEffect;
  turnRight(): RuntimeEffect;
  pathAhead(): boolean;
}
