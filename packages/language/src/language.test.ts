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

console.log("language: 4 tests passed");
