import { countBlocks, program, validateProgram } from "./index.js";

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

assert(
  countBlocks(program([{ type: "repeat", count: 5, body: [{ type: "moveForward" }] }])) === 2,
  "counts control structures and their authored body once",
);

assert(
  !validateProgram({ version: 1, statements: [{ type: "repeat", count: 101, body: [] }] }).ok,
  "rejects excessive repeat counts",
);
assert(
  !validateProgram({ version: 1, statements: [{ type: "launchMissile" }] }).ok,
  "rejects unknown statements",
);
const candidate: unknown = JSON.parse(JSON.stringify(program([{ type: "moveForward" }])));
assert(validateProgram(candidate).ok, "accepts a serialized program");

const ifElse = { version: 2, statements: [{ type: "ifElse", condition: { type: "pathAhead" }, thenBody: [{ type: "moveForward" }], elseBody: [{ type: "turnRight" }] }] };
assert(validateProgram(ifElse).ok, "accepts If / Else in a version 2 program");
assert(!validateProgram({ ...ifElse, version: 1 }).ok, "rejects If / Else in a version 1 program");
assert(countBlocks(ifElse as Parameters<typeof countBlocks>[0]) === 3, "counts both authored If / Else branches");

const version3 = { version: 3, statements: [{ type: "while", condition: { type: "path", direction: "left" }, body: [{ type: "moveForward" }] }, { type: "repeatUntilGoal", body: [{ type: "turnRight" }] }] };
assert(validateProgram(version3).ok, "accepts canonical conditions and loops in version 3");
assert(!validateProgram({ ...version3, version: 2 }).ok, "rejects version 3 controls in older programs");
assert(!validateProgram({ version: 3, statements: [{ type: "if", condition: { type: "path", direction: "behind" }, body: [] }] }).ok, "rejects unsupported path directions");
assert(countBlocks(version3 as Parameters<typeof countBlocks>[0]) === 4, "counts While and Repeat Until bodies");

console.log("language: 11 tests passed");
