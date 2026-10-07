import { program } from "@kodergarden/language";
import { executeProgram, GridRuntime, type GridWorldDefinition } from "./index.js";

const world: GridWorldDefinition = { width: 4, height: 3, blocked: [{ x: 1, y: 1 }], robot: { x: 0, y: 2, direction: "north" }, goal: { x: 3, y: 0 } };
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
const equal = (actual: unknown, expected: unknown, message: string): void =>
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: ${JSON.stringify(actual)}`);

const runtime = new GridRuntime(world);
assert(runtime.moveForward().type === "moved", "moves into an open cell");
runtime.turnRight();
equal(runtime.moveForward(), { type: "blocked", reason: "obstacle" }, "reports an obstacle");
equal(runtime.snapshot().robot, { x: 0, y: 1, direction: "east" }, "blocked movement preserves position");

const repeated = program([{ type: "repeat", count: 2, body: [{ type: "moveForward" }] }, { type: "turnRight" }, { type: "repeat", count: 3, body: [{ type: "moveForward" }] }]);
const first = executeProgram(repeated, new GridRuntime(world));
const second = executeProgram(repeated, new GridRuntime(world));
equal(first, second, "execution is deterministic");
assert(first.executionSteps === 6, "counts executed commands separately");
assert(first.succeeded, "detects the goal");
const repeatedMoveStarts = first.events.filter(
  (event) => event.type === "statementStarted" && event.statementType === "moveForward",
);
assert(
  repeatedMoveStarts.every((event) => event.type === "statementStarted" && event.path.length === 2),
  "repeat events retain stable authored statement paths",
);

const conditional = program([{ type: "moveForward" }, { type: "turnRight" }, { type: "if", condition: { type: "pathAhead" }, body: [{ type: "moveForward" }] }]);
const conditionalResult = executeProgram(conditional, new GridRuntime(world));
assert(conditionalResult.finalState.robot.x === 0 && conditionalResult.finalState.robot.y === 1, "environment evaluates pathAhead");
assert(conditionalResult.executionSteps === 2, "skipped branch adds no execution steps");
assert(conditionalResult.events.some((event) => event.type === "conditionEvaluated" && !event.result), "reports a false condition evaluation");

const trueConditional = executeProgram(program([{ type: "if", condition: { type: "pathAhead" }, body: [{ type: "moveForward" }] }]), new GridRuntime(world));
assert(trueConditional.events.some((event) => event.type === "conditionEvaluated" && event.result), "reports a true condition evaluation");

const falseIfElse = executeProgram({ version: 2, statements: [{ type: "moveForward" }, { type: "turnRight" }, { type: "ifElse", condition: { type: "pathAhead" }, thenBody: [{ type: "moveForward" }], elseBody: [{ type: "turnLeft" }] }] }, new GridRuntime(world));
assert(falseIfElse.finalState.robot.direction === "north", "runs the Else branch when the condition is false");
const trueIfElse = executeProgram({ version: 2, statements: [{ type: "ifElse", condition: { type: "pathAhead" }, thenBody: [{ type: "moveForward" }], elseBody: [{ type: "turnRight" }] }] }, new GridRuntime(world));
assert(trueIfElse.finalState.robot.y === 1, "runs the Then branch when the condition is true");

const limited = executeProgram(program([{ type: "repeat", count: 10, body: [{ type: "turnRight" }] }]), new GridRuntime(world), { maxSteps: 3 });
assert(limited.stoppedByLimit && limited.executionSteps === 3, "stops at the execution limit");
assert(limited.events.at(-1)?.type === "executionLimitReached", "emits the limit event");

console.log("engine: 14 tests passed");
