import type { Condition, EvaluatedCondition, Program, Statement } from "@kodergarden/language";
import type { ProgramRuntime, RuntimeEffect, RuntimeSnapshot } from "./runtime.js";

/** Branches are part of an execution address, without changing saved ASTs. */
export type ExecutionPath = readonly (number | "then" | "else")[];
export type LimitReason = "steps" | "controlIterations" | "operations" | "events" | "depth";
export interface ExecutionLimits { readonly maxSteps: number; readonly maxControlIterations?: number; readonly maxOperations?: number; readonly maxEvents?: number }
export const DEFAULT_EXECUTION_LIMITS: Required<ExecutionLimits> = { maxSteps: 1_000, maxControlIterations: 10_000, maxOperations: 20_000, maxEvents: 50_000 };
export type ExecutionEvent<TSnapshot extends RuntimeSnapshot = RuntimeSnapshot> =
  | { readonly type: "programStarted"; readonly state: TSnapshot }
  | { readonly type: "statementStarted"; readonly path: ExecutionPath; readonly statementType: Statement["type"] }
  | { readonly type: "conditionEvaluated"; readonly path: ExecutionPath; readonly condition: EvaluatedCondition; readonly result: boolean }
  | { readonly type: "loopIteration"; readonly path: ExecutionPath; readonly iteration: number }
  | { readonly type: "runtimeEffect"; readonly path: ExecutionPath; readonly effect: RuntimeEffect; readonly state: TSnapshot }
  | { readonly type: "statementCompleted"; readonly path: ExecutionPath }
  | { readonly type: "goalReached"; readonly state: TSnapshot }
  | { readonly type: "programCompleted"; readonly state: TSnapshot; readonly executionSteps: number }
  | { readonly type: "programFailed"; readonly state: TSnapshot; readonly executionSteps: number }
  | { readonly type: "executionLimitReached"; readonly state: TSnapshot; readonly executionSteps: number; readonly reason: LimitReason };
export interface ExecutionResult<TSnapshot extends RuntimeSnapshot> {
  readonly events: readonly ExecutionEvent<TSnapshot>[];
  readonly finalState: TSnapshot;
  readonly executionSteps: number;
  readonly operations: number;
  readonly succeeded: boolean;
  readonly stoppedByLimit: boolean;
  readonly termination: "normal" | "limit";
  readonly goalReached: boolean;
}

export function executeProgram<TSnapshot extends RuntimeSnapshot>(program: Program, runtime: ProgramRuntime<TSnapshot>, limits: ExecutionLimits = DEFAULT_EXECUTION_LIMITS): ExecutionResult<TSnapshot> {
  const budget = { ...DEFAULT_EXECUTION_LIMITS, ...limits };
  for (const value of Object.values(budget)) if (!Number.isSafeInteger(value) || value < 1) throw new RangeError("Execution limits must be positive safe integers");
  const events: ExecutionEvent<TSnapshot>[] = [];
  let executionSteps = 0, controlIterations = 0, operations = 0;
  let goalReported = runtime.snapshot().completed;
  let stoppedByLimit = false;
  const stop = (reason: LimitReason): void => {
    if (stoppedByLimit) return;
    stoppedByLimit = true;
    events.push({ type: "executionLimitReached", state: runtime.snapshot(), executionSteps, reason });
  };
  const emit = (event: ExecutionEvent<TSnapshot>): void => {
    if (stoppedByLimit) return;
    if (events.length >= budget.maxEvents - 1) { stop("events"); return; }
    events.push(event);
  };
  const fuel = (): boolean => {
    if (stoppedByLimit) return false;
    if (operations >= budget.maxOperations) { stop("operations"); return false; }
    operations += 1; return true;
  };
  emit({ type: "programStarted", state: runtime.snapshot() });
  if (!stoppedByLimit) for (const effect of runtime.beginExecution?.() ?? []) { if (!fuel()) break; emit({ type: "runtimeEffect", path: [], effect, state: runtime.snapshot() }); if (stoppedByLimit) break; }
  const evaluateCondition = (condition: Condition, path: ExecutionPath): boolean => {
    const canonical = condition.type === "pathAhead" ? { type: "path" as const, direction: "ahead" as const } : condition;
    const result = canonical.type === "itemHere" ? runtime.itemPresent() : runtime.pathOpen(canonical.direction);
    emit({ type: "conditionEvaluated", path, condition: canonical, result });
    return result;
  };
  const beginIteration = (path: ExecutionPath, iteration: number): boolean => {
    if (!fuel()) return false;
    if (controlIterations >= budget.maxControlIterations) { stop("controlIterations"); return false; }
    controlIterations += 1; emit({ type: "loopIteration", path, iteration });
    return !stoppedByLimit;
  };
  const execute = (statements: readonly Statement[], parentPath: ExecutionPath): void => {
    if (parentPath.length > 256) { stop("depth"); return; }
    for (let index = 0; index < statements.length && !stoppedByLimit; index += 1) {
      if (!fuel()) break;
      const statement = statements[index]!;
      const path = [...parentPath, index];
      emit({ type: "statementStarted", path, statementType: statement.type });
      if (stoppedByLimit) break;
      if (statement.type === "repeat") {
        for (let iteration = 1; iteration <= statement.count; iteration += 1) {
          if (!beginIteration(path, iteration)) break;
          execute(statement.body, path);
        }
      } else if (statement.type === "if" || statement.type === "ifElse") {
        const result = evaluateCondition(statement.condition, path);
        if (statement.type === "if") { if (result) execute(statement.body, path); }
        else execute(result ? statement.thenBody : statement.elseBody, [...path, result ? "then" : "else"]);
      } else if (statement.type === "while") {
        let iteration = 0;
        while (fuel() && evaluateCondition(statement.condition, path)) {
          if (!beginIteration(path, ++iteration)) break;
          execute(statement.body, path);
        }
      } else if (statement.type === "repeatUntilGoal") {
        let iteration = 0;
        while (fuel()) {
          const result = runtime.snapshot().completed;
          emit({ type: "conditionEvaluated", path, condition: { type: "goalReached" }, result });
          if (result || !beginIteration(path, ++iteration)) break;
          execute(statement.body, path);
        }
      } else {
        if (executionSteps >= budget.maxSteps) { stop("steps"); break; }
        const effect = statement.type === "moveForward" ? runtime.moveForward() : statement.type === "turnLeft" ? runtime.turnLeft() : statement.type === "turnRight" ? runtime.turnRight() : runtime.collect();
        executionSteps += 1;
        const state = runtime.snapshot();
        emit({ type: "runtimeEffect", path, effect, state });
        if (state.completed && !goalReported) { emit({ type: "goalReached", state }); goalReported = true; }
      }
      if (!stoppedByLimit) emit({ type: "statementCompleted", path });
    }
  };
  execute(program.statements, []);
  const finalState = runtime.snapshot();
  if (!stoppedByLimit) emit({ type: finalState.completed ? "programCompleted" : "programFailed", state: finalState, executionSteps });
  return { events, finalState, executionSteps, operations, succeeded: finalState.completed && !stoppedByLimit, stoppedByLimit, termination: stoppedByLimit ? "limit" : "normal", goalReached: finalState.completed };
}
