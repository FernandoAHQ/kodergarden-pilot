import type { ExecutionEvent, GridSnapshot } from "@kodergarden/engine";

export type PlaybackStatus = "ready" | "running" | "success" | "incomplete" | "limit";
export interface PlaybackState {
  readonly snapshot: GridSnapshot;
  readonly activePath: readonly number[] | null;
  readonly status: PlaybackStatus;
  readonly message: string;
  readonly collision: "boundary" | "obstacle" | null;
  readonly conditionResult: { readonly path: readonly number[]; readonly result: boolean } | null;
  readonly executionSteps: number;
}

export const initialPlaybackState = (snapshot: GridSnapshot): PlaybackState => ({
  snapshot,
  activePath: null,
  status: "ready",
  message: "Ready when you are",
  collision: null,
  conditionResult: null,
  executionSteps: 0,
});

export function applyExecutionEvent(state: PlaybackState, event: ExecutionEvent<GridSnapshot>): PlaybackState {
  switch (event.type) {
    case "programStarted":
      return { ...state, snapshot: event.state, status: "running", message: "Program running…", collision: null, executionSteps: 0 };
    case "statementStarted":
      return { ...state, activePath: event.path, collision: null, conditionResult: null };
    case "conditionEvaluated":
      return { ...state, conditionResult: { path: event.path, result: event.result }, message: event.result ? "Path ahead → YES" : "Path ahead → NO" };
    case "statementCompleted":
      return { ...state, activePath: null };
    case "runtimeEffect":
      return {
        ...state,
        snapshot: event.state,
        collision: event.effect.type === "blocked" ? event.effect.reason : null,
        message: event.effect.type === "blocked" ? "Path blocked — Pip stayed put" : state.message,
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
  const base = event.type === "runtimeEffect" ? (event.effect.type === "turned" ? 430 : 520) : event.type === "conditionEvaluated" ? 520 : event.type === "goalReached" ? 500 : event.type === "statementStarted" ? 150 : 80;
  return base / speed;
};
