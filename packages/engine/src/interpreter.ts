import type { Condition, EvaluatedCondition, PathCondition, Program, Statement } from "@kodergarden/language";
import type { ProgramRuntime, RuntimeEffect, RuntimeSnapshot } from "./runtime.js";

export interface ExecutionLimits { readonly maxSteps: number; readonly maxControlIterations?: number }
export const DEFAULT_EXECUTION_LIMITS: Required<ExecutionLimits> = { maxSteps: 1_000, maxControlIterations: 10_000 };
export type ExecutionEvent<TSnapshot extends RuntimeSnapshot = RuntimeSnapshot> =
  | { readonly type: "programStarted"; readonly state: TSnapshot }
  | { readonly type: "statementStarted"; readonly path: readonly number[]; readonly statementType: Statement["type"] }
  | { readonly type: "conditionEvaluated"; readonly path: readonly number[]; readonly condition: EvaluatedCondition; readonly result: boolean }
  | { readonly type: "runtimeEffect"; readonly path: readonly number[]; readonly effect: RuntimeEffect; readonly state: TSnapshot }
  | { readonly type: "statementCompleted"; readonly path: readonly number[] }
  | { readonly type: "goalReached"; readonly state: TSnapshot }
  | { readonly type: "programCompleted"; readonly state: TSnapshot; readonly executionSteps: number }
  | { readonly type: "programFailed"; readonly state: TSnapshot; readonly executionSteps: number }
  | { readonly type: "executionLimitReached"; readonly state: TSnapshot; readonly executionSteps: number; readonly reason: "steps" | "controlIterations" };

export interface ExecutionResult<TSnapshot extends RuntimeSnapshot> {
  readonly events: readonly ExecutionEvent<TSnapshot>[];
  readonly finalState: TSnapshot;
  readonly executionSteps: number;
  readonly succeeded: boolean;
  readonly stoppedByLimit: boolean;
}

export function executeProgram<TSnapshot extends RuntimeSnapshot>(program: Program, runtime: ProgramRuntime<TSnapshot>, limits: ExecutionLimits = DEFAULT_EXECUTION_LIMITS): ExecutionResult<TSnapshot> {
  const events: ExecutionEvent<TSnapshot>[] = [{ type: "programStarted", state: runtime.snapshot() }];
  for(const effect of runtime.beginExecution?.()??[])events.push({type:"runtimeEffect",path:[],effect,state:runtime.snapshot()});
  let executionSteps = 0;
  let controlIterations = 0;
  let goalReported = runtime.snapshot().completed;
  let stoppedByLimit = false;
  const maxControlIterations = limits.maxControlIterations ?? DEFAULT_EXECUTION_LIMITS.maxControlIterations;

  const canonicalCondition = (condition: Condition): PathCondition => condition.type === "pathAhead" ? { type: "path", direction: "ahead" } : condition;
  const evaluatePath = (condition: Condition, path: readonly number[]): boolean => {
    const canonical = canonicalCondition(condition);
    const result = runtime.pathOpen(canonical.direction);
    events.push({ type: "conditionEvaluated", path, condition: canonical, result });
    return result;
  };
  const beginControlIteration = (): boolean => {
    if (controlIterations >= maxControlIterations) {
      stoppedByLimit = true;
      events.push({ type: "executionLimitReached", state: runtime.snapshot(), executionSteps, reason: "controlIterations" });
      return false;
    }
    controlIterations += 1;
    return true;
  };

  const execute = (statements: readonly Statement[], parentPath: readonly number[]): void => {
    for (let index = 0; index < statements.length && !stoppedByLimit; index += 1) {
      const statement = statements[index]!;
      const path = [...parentPath, index];
      events.push({ type: "statementStarted", path, statementType: statement.type });
      if (statement.type === "repeat") {
        for (let iteration = 0; iteration < statement.count && !stoppedByLimit; iteration += 1) execute(statement.body, path);
      } else if (statement.type === "if" || statement.type === "ifElse") {
        const result = evaluatePath(statement.condition, path);
        if (statement.type === "if") {
          if (result) execute(statement.body, path);
        } else {
          execute(result ? statement.thenBody : statement.elseBody, path);
        }
      } else if (statement.type === "while") {
        while (!stoppedByLimit && evaluatePath(statement.condition, path)) {
          if (!beginControlIteration()) break;
          execute(statement.body, path);
        }
      } else if (statement.type === "repeatUntilGoal") {
        while (!stoppedByLimit) {
          const result = runtime.snapshot().completed;
          events.push({ type: "conditionEvaluated", path, condition: { type: "goalReached" }, result });
          if (result || !beginControlIteration()) break;
          execute(statement.body, path);
        }
      } else {
        if (executionSteps >= limits.maxSteps) {
          stoppedByLimit = true;
          events.push({ type: "executionLimitReached", state: runtime.snapshot(), executionSteps, reason: "steps" });
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
