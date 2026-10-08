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

for (const direction of ["north", "east", "south", "west"] as const) {
  const sensor = new GridRuntime({ width: 3, height: 3, blocked: [{ x: 0, y: 1 }], robot: { x: 1, y: 1, direction }, goal: { x: 2, y: 2 } });
  const expectedBlocked = direction === "north" ? "left" : direction === "south" ? "right" : direction === "west" ? "ahead" : null;
  for (const relative of ["ahead", "left", "right"] as const) assert(sensor.pathOpen(relative) === (relative !== expectedBlocked), `${relative} sensing is relative to ${direction}`);
}

const hallway: GridWorldDefinition = { width: 4, height: 1, blocked: [], robot: { x: 0, y: 0, direction: "east" }, goal: { x: 3, y: 0 } };
const whileResult = executeProgram({ version: 3, statements: [{ type: "while", condition: { type: "path", direction: "ahead" }, body: [{ type: "moveForward" }] }] }, new GridRuntime(hallway));
assert(whileResult.succeeded && whileResult.executionSteps === 3, "While runs until its path condition becomes false");
const zeroWhile = executeProgram({ version: 3, statements: [{ type: "while", condition: { type: "path", direction: "left" }, body: [{ type: "moveForward" }] }] }, new GridRuntime(hallway));
assert(zeroWhile.executionSteps === 0, "While may execute zero times");
const untilResult = executeProgram({ version: 3, statements: [{ type: "repeatUntilGoal", body: [{ type: "moveForward" }] }] }, new GridRuntime(hallway));
assert(untilResult.succeeded && untilResult.executionSteps === 3, "Repeat Until stops as soon as the goal is reached");
const alreadyComplete = executeProgram({ version: 3, statements: [{ type: "repeatUntilGoal", body: [{ type: "moveForward" }] }] }, new GridRuntime({ ...hallway, goal: { x: 0, y: 0 } }));
assert(alreadyComplete.executionSteps === 0 && alreadyComplete.succeeded, "Repeat Until runs zero times when already complete");
const nonProgressing = executeProgram({ version: 3, statements: [{ type: "while", condition: { type: "path", direction: "ahead" }, body: [] }] }, new GridRuntime(hallway), { maxSteps: 100, maxControlIterations: 3 });
assert(nonProgressing.stoppedByLimit && nonProgressing.events.some((event) => event.type === "executionLimitReached" && event.reason === "controlIterations"), "control iteration limit stops an empty While loop");

const limited = executeProgram(program([{ type: "repeat", count: 10, body: [{ type: "turnRight" }] }]), new GridRuntime(world), { maxSteps: 3 });
assert(limited.stoppedByLimit && limited.executionSteps === 3, "stops at the execution limit");
assert(limited.events.at(-1)?.type === "executionLimitReached", "emits the limit event");

const shiftingWorld: GridWorldDefinition = { width:4,height:3,blocked:[],robot:{x:0,y:1,direction:"east"},goal:{x:0,y:0},shiftingHedges:[{id:"gate",from:{x:1,y:0},to:{x:1,y:1}}] };
const shiftingProgram={version:2 as const,statements:[{type:"ifElse" as const,condition:{type:"pathAhead" as const},thenBody:[{type:"moveForward" as const}],elseBody:[{type:"turnLeft" as const}]},{type:"moveForward" as const}]};
const shifted=executeProgram(shiftingProgram,new GridRuntime(shiftingWorld));
const worldChangeIndex=shifted.events.findIndex((event)=>event.type==="runtimeEffect"&&event.effect.type==="worldChanged");
const conditionIndex=shifted.events.findIndex((event)=>event.type==="conditionEvaluated");
assert(worldChangeIndex>0&&conditionIndex>worldChangeIndex,"shifting hedge finishes before sensing begins");
assert(shifted.succeeded&&shifted.executionSteps===2,"sensing uses the shifted world without counting the shift as a command");
equal(executeProgram(shiftingProgram,new GridRuntime(shiftingWorld)),shifted,"shifting hedge resets deterministically");
assert(JSON.stringify(shifted.finalState).includes('"shiftingHedges"'),"dynamic positions serialize in snapshots");
for(const invalid of [
  {...shiftingWorld,shiftingHedges:[{id:"gate",from:{x:1,y:0},to:{x:0,y:1}}]},
  {...shiftingWorld,blocked:[{x:1,y:1}]},
  {...shiftingWorld,shiftingHedges:[{id:"gate",from:{x:1,y:0},to:{x:1,y:1}},{id:"gate",from:{x:2,y:2},to:{x:3,y:2}}]},
]){let rejected=false;try{new GridRuntime(invalid);}catch{rejected=true;}assert(rejected,"invalid shifting hedge placement is rejected");}

console.log("engine: 38 tests passed");
