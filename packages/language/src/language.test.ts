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

console.log("language: 7 tests passed");
