import type { Program, Statement } from "@kodergarden/language";
import type { ProgramRuntime, RuntimeEffect, RuntimeSnapshot } from "./runtime.js";

export interface ExecutionLimits { readonly maxSteps: number }
export const DEFAULT_EXECUTION_LIMITS: ExecutionLimits = { maxSteps: 1_000 };
export type ExecutionEvent<TSnapshot extends RuntimeSnapshot = RuntimeSnapshot> =
  | { readonly type: "programStarted"; readonly state: TSnapshot }
  | { readonly type: "statementStarted"; readonly path: readonly number[]; readonly statementType: Statement["type"] }
  | { readonly type: "conditionEvaluated"; readonly path: readonly number[]; readonly conditionType: "pathAhead"; readonly result: boolean }
  | { readonly type: "runtimeEffect"; readonly path: readonly number[]; readonly effect: RuntimeEffect; readonly state: TSnapshot }
  | { readonly type: "statementCompleted"; readonly path: readonly number[] }
  | { readonly type: "goalReached"; readonly state: TSnapshot }
  | { readonly type: "programCompleted"; readonly state: TSnapshot; readonly executionSteps: number }
  | { readonly type: "programFailed"; readonly state: TSnapshot; readonly executionSteps: number }
  | { readonly type: "executionLimitReached"; readonly state: TSnapshot; readonly executionSteps: number };

export interface ExecutionResult<TSnapshot extends RuntimeSnapshot> {
  readonly events: readonly ExecutionEvent<TSnapshot>[];
  readonly finalState: TSnapshot;
  readonly executionSteps: number;
  readonly succeeded: boolean;
  readonly stoppedByLimit: boolean;
}

export function executeProgram<TSnapshot extends RuntimeSnapshot>(program: Program, runtime: ProgramRuntime<TSnapshot>, limits: ExecutionLimits = DEFAULT_EXECUTION_LIMITS): ExecutionResult<TSnapshot> {
  const events: ExecutionEvent<TSnapshot>[] = [{ type: "programStarted", state: runtime.snapshot() }];
  let executionSteps = 0;
  let goalReported = runtime.snapshot().completed;
  let stoppedByLimit = false;

  const execute = (statements: readonly Statement[], parentPath: readonly number[]): void => {
    for (let index = 0; index < statements.length && !stoppedByLimit; index += 1) {
      const statement = statements[index]!;
      const path = [...parentPath, index];
      events.push({ type: "statementStarted", path, statementType: statement.type });
      if (statement.type === "repeat") {
        for (let iteration = 0; iteration < statement.count && !stoppedByLimit; iteration += 1) execute(statement.body, path);
      } else if (statement.type === "if" || statement.type === "ifElse") {
        const result = runtime.pathAhead();
        events.push({ type: "conditionEvaluated", path, conditionType: statement.condition.type, result });
        if (statement.type === "if") {
          if (result) execute(statement.body, path);
        } else {
          execute(result ? statement.thenBody : statement.elseBody, path);
        }
      } else {
        if (executionSteps >= limits.maxSteps) {
          stoppedByLimit = true;
          events.push({ type: "executionLimitReached", state: runtime.snapshot(), executionSteps });
          break;
        }
        const effect = statement.type === "moveForward" ? runtime.moveForward() : statement.type === "turnLeft" ? runtime.turnLeft() : runtime.turnRight();
        executionSteps += 1;
        const state = runtime.snapshot();
        events.push({ type: "runtimeEffect", path, effect, state });
        if (state.completed && !goalReported) { events.push({ type: "goalReached", state }); goalReported = true; }
      }
      if (!stoppedByLimit) events.push({ type: "statementCompleted", path });
    }
  };
  execute(program.statements, []);
  const finalState = runtime.snapshot();
  if (!stoppedByLimit) events.push(finalState.completed ? { type: "programCompleted", state: finalState, executionSteps } : { type: "programFailed", state: finalState, executionSteps });
  return { events, finalState, executionSteps, succeeded: finalState.completed, stoppedByLimit };
}
