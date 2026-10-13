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

// Safety limits are failures even when the robot happens to be at the goal.
const goalStart: GridWorldDefinition = {width:3,height:3,blocked:[],robot:{x:1,y:1,direction:"east"},goal:{x:1,y:1}};
const emptyWhile = executeProgram({version:3,statements:[{type:"while",condition:{type:"path",direction:"ahead"},body:[]}]},new GridRuntime(goalStart),{maxSteps:10,maxControlIterations:2});
assert(emptyWhile.goalReached && !emptyWhile.succeeded && emptyWhile.termination === "limit","goal and normal termination are independent");
const nestedEmpty = program([{type:"repeat",count:100,body:[{type:"repeat",count:100,body:[]}]}]);
const fueled = executeProgram(nestedEmpty,new GridRuntime(goalStart),{maxSteps:10,maxOperations:12});
assert(fueled.stoppedByLimit && fueled.operations === 12 && fueled.executionSteps === 0,"empty fixed repeats consume fuel");
const capped = executeProgram(nestedEmpty,new GridRuntime(goalStart),{maxSteps:10,maxEvents:8});
assert(capped.events.length === 8 && capped.events.at(-1)?.type === "executionLimitReached","trace memory is bounded and ends with one safety event");
const choice = {version:3 as const,statements:[{type:"ifElse" as const,condition:{type:"path" as const,direction:"ahead" as const},thenBody:[{type:"turnLeft" as const}],elseBody:[{type:"turnRight" as const}]}]};
const yes = executeProgram(choice,new GridRuntime(goalStart));
const no = executeProgram(choice,new GridRuntime({...goalStart,blocked:[{x:2,y:1}]}));
assert(yes.events.some(e=>e.type==="runtimeEffect"&&JSON.stringify(e.path)==='[0,"then",0]'),"Then has an unambiguous address");
assert(no.events.some(e=>e.type==="runtimeEffect"&&JSON.stringify(e.path)==='[0,"else",0]'),"Else has an unambiguous address");
const twoHedges = executeProgram(program([]),new GridRuntime({width:5,height:3,blocked:[],robot:{x:0,y:0,direction:"east"},goal:{x:4,y:0},shiftingHedges:[{id:"a",from:{x:1,y:1},to:{x:1,y:2}},{id:"b",from:{x:3,y:1},to:{x:3,y:2}}]}));
const shifts = twoHedges.events.filter(e=>e.type==="runtimeEffect"&&e.effect.type==="worldChanged");
assert(shifts[0]?.type === "runtimeEffect" && shifts[0].state.shiftingHedges?.[1]?.position.y === 1,"the first hedge frame does not prematurely move the second hedge");
const itemWorld:GridWorldDefinition={width:5,height:1,blocked:[],robot:{x:0,y:0,direction:"east"},goal:{x:4,y:0},items:[{id:"packet-0",position:{x:0,y:0}},{id:"packet-2",position:{x:2,y:0}}]};
const collectProgram={version:4 as const,statements:[{type:"repeat" as const,count:4,body:[{type:"if" as const,condition:{type:"itemHere" as const},body:[{type:"collect" as const}]},{type:"moveForward" as const}]}]};
const collection=executeProgram(collectProgram,new GridRuntime(itemWorld));
assert(collection.succeeded&&collection.finalState.destinationReached&&collection.finalState.collectedItems===2&&collection.finalState.items?.length===0,"item sensor and Collect satisfy both objectives");
assert(collection.events.filter(event=>event.type==="conditionEvaluated"&&event.condition.type==="itemHere").length===4,"item sensing is traced without consuming packets");
const missed=executeProgram({version:4,statements:[{type:"repeat",count:4,body:[{type:"moveForward"}]}]},new GridRuntime(itemWorld));
assert(missed.finalState.destinationReached&&!missed.succeeded&&missed.finalState.collectedItems===0,"reaching the destination does not complete an item objective");
const invalidCollect=executeProgram({version:4,statements:[{type:"collect"}]},new GridRuntime({...itemWorld,items:[]}));
assert(invalidCollect.finalState.invalidCollections===1&&invalidCollect.events.some(event=>event.type==="runtimeEffect"&&event.effect.type==="collectFailed"),"empty collection is explicit and deterministic");
for(const invalid of [{...itemWorld,items:[{id:"same",position:{x:0,y:0}},{id:"same",position:{x:1,y:0}}]},{...itemWorld,items:[{id:"a",position:{x:1,y:0}},{id:"b",position:{x:1,y:0}}]}]){let rejected=false;try{new GridRuntime(invalid);}catch{rejected=true;}assert(rejected,"invalid item definitions are rejected");}
console.log("engine: additional safety, branch and snapshot regression checks passed");
