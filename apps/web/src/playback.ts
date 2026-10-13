import type { ExecutionPath } from "@kodergarden/engine";
import type { ExecutionEvent, GridSnapshot } from "@kodergarden/engine";
import type { EvaluatedCondition } from "@kodergarden/language";

export type PlaybackStatus = "ready" | "running" | "success" | "incomplete" | "limit";
export interface PlaybackState {
  readonly snapshot: GridSnapshot;
  readonly activePath: ExecutionPath | null;
  readonly status: PlaybackStatus;
  readonly message: string;
  readonly collision: "boundary" | "obstacle" | null;
  readonly collectionError: boolean;
  readonly conditionResult: { readonly path: ExecutionPath; readonly condition: EvaluatedCondition; readonly result: boolean } | null;
  readonly executionSteps: number;
  readonly conditions: readonly NonNullable<PlaybackState["conditionResult"]>[];
  readonly loop: { readonly path: ExecutionPath; readonly iteration: number } | null;
  readonly loops: readonly { readonly path: ExecutionPath; readonly iteration: number }[];
}

export const initialPlaybackState = (snapshot: GridSnapshot): PlaybackState => ({
  snapshot,
  activePath: null,
  status: "ready",
  message: "Ready when you are",
  collision: null,
  collectionError: false,
  conditionResult: null,
  executionSteps: 0,
  conditions: [], loop: null, loops: [],
});

export function applyExecutionEvent(state: PlaybackState, event: ExecutionEvent<GridSnapshot>): PlaybackState {
  switch (event.type) {
    case "programStarted":
      return { ...state, snapshot: event.state, status: "running", message: "Program running…", collision: null, collectionError:false, executionSteps: 0, conditions: [], conditionResult: null, loop: null, loops: [] };
    case "statementStarted":
      return { ...state, activePath: event.path, collision: null, collectionError:false };
    case "loopIteration":
      return { ...state, activePath: event.path, loops: [...state.loops.filter(item=>JSON.stringify(item.path)!==JSON.stringify(event.path)),{path:event.path,iteration:event.iteration}], loop: { path: event.path, iteration: event.iteration } };
    case "conditionEvaluated":
      return { ...state, activePath: event.path, conditions: [...state.conditions.filter(item => JSON.stringify(item.path) !== JSON.stringify(event.path)), { path: event.path, condition: event.condition, result: event.result }], conditionResult: { path: event.path, condition: event.condition, result: event.result }, message: event.result ? "Condition → YES" : "Condition → NO" };
    case "statementCompleted": {
      const conditions = state.conditions.filter(item => JSON.stringify(item.path) !== JSON.stringify(event.path));
      return { ...state, loops:state.loops.filter(item=>JSON.stringify(item.path)!==JSON.stringify(event.path)), conditions, conditionResult: conditions.at(-1) ?? null };
    }
    case "runtimeEffect":
      if (event.effect.type === "worldChanged") return {
        ...state,
        snapshot: event.state,
        collision: null,
        conditionResult: null,
        message: "The hedges shifted before Pip started",
      };
      return {
        ...state,
        snapshot: event.state,
        collision: event.effect.type === "blocked" ? event.effect.reason : null,
        collectionError:event.effect.type === "collectFailed",
        message: event.effect.type === "blocked" ? "Path blocked — Pip stayed put" : event.effect.type === "collectFailed" ? "There is no packet here" : event.effect.type === "collected" ? "Seed packet collected" : state.message,
        executionSteps: state.executionSteps + 1,
      };
    case "goalReached":
      return { ...state, snapshot: event.state, message: "Battery reached!" };
    case "programCompleted":
      return { ...state, snapshot: event.state, activePath: null, status: "success", message: "Challenge complete!", executionSteps: event.executionSteps };
    case "programFailed":
      return { ...state, snapshot: event.state, activePath: null, status: "incomplete", message: "Program finished — not at the battery yet", executionSteps: event.executionSteps };
    case "executionLimitReached":
      return { ...state, snapshot: event.state, activePath: null, status: "limit", message: "Execution limit reached", executionSteps: event.executionSteps };
  }
}

export const playbackDelay = (event: ExecutionEvent<GridSnapshot>, speed: number): number => {
  const base = event.type === "runtimeEffect" ? (event.effect.type === "worldChanged" ? 760 : event.effect.type === "turned" ? 430 : 520) : event.type === "conditionEvaluated" ? 520 : event.type === "goalReached" ? 500 : event.type === "statementStarted" ? 150 : 80;
  return base / speed;
};

/** A step is a command effect, condition decision, loop iteration or terminal result. */
export function semanticFrames(initial: GridSnapshot, events: readonly ExecutionEvent<GridSnapshot>[]): readonly PlaybackState[] {
  const frames: PlaybackState[] = [initialPlaybackState(initial)];
  let state = frames[0]!;
  for (const event of events) {
    state = applyExecutionEvent(state, event);
    if (["runtimeEffect", "conditionEvaluated", "loopIteration", "programCompleted", "programFailed", "executionLimitReached"].includes(event.type)) frames.push(state);
  }
  return frames;
}
