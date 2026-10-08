import { createEditorId, createPaletteStatement, routeDragEnd, resolveDropDestination } from "./dragEnd.js";
import { insertStatement, type EditorProgram } from "./model.js";

const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };

const tabletRoute = routeDragEnd(
  { id: "palette:moveForward", data: { source: "palette", kind: "moveForward" } },
  { id: "drop:root:0" },
  0,
);
assert(tabletRoute.action === "insert" && tabletRoute.kind === "moveForward", "tablet palette event selects insertion route");
assert(tabletRoute.action === "insert" && tabletRoute.destination.containerId === null && tabletRoute.destination.index === 0, "tablet drop ID resolves root index zero");
assert(tabletRoute.action === "insert" && tabletRoute.destinationSource === "id", "tablet event resolves destination from stable ID when metadata is absent");
const empty: EditorProgram = { statements: [] };
const inserted = tabletRoute.action === "insert" ? insertStatement(empty, tabletRoute.destination, createPaletteStatement(tabletRoute.kind, () => "tablet-move")) : empty;
assert(inserted.statements.length === 1 && inserted.statements[0]?.type === "moveForward", "tablet drag route creates and inserts Move Forward from root zero to one");
const insecureContextId = createEditorId((values) => { values[0] = 123; values[1] = 456; }, () => 789);
assert(insecureContextId.startsWith("editor-lx-3fco-"), "editor IDs do not depend on secure-context randomUUID");

const nested = resolveDropDestination({ id: "drop:repeat-123:2" }, 0);
assert(nested.location?.containerId === "repeat-123" && nested.location.index === 2, "nested drop IDs preserve container and index");
const repeatProgram: EditorProgram = { statements: [{ id: "repeat-1", type: "repeat", count: 3, body: [] }] };
const repeatRoute = routeDragEnd({ id: "palette:moveForward", data: { source: "palette", kind: "moveForward" } }, { id: "drop:repeat-1:0" }, 1);
const repeatInserted = repeatRoute.action === "insert" ? insertStatement(repeatProgram, repeatRoute.destination, createPaletteStatement(repeatRoute.kind, () => "repeat-move")) : repeatProgram;
assert(repeatInserted.statements[0]?.type === "repeat" && repeatInserted.statements[0].body[0]?.id === "repeat-move", "palette drop inserts into Repeat body");
const ifProgram: EditorProgram = { statements: [{ id: "if-1", type: "if", condition: "ahead", body: [] }] };
const ifRoute = routeDragEnd({ id: "palette:moveForward", data: { source: "palette", kind: "moveForward" } }, { id: "drop:if-1:0" }, 1);
const ifInserted = ifRoute.action === "insert" ? insertStatement(ifProgram, ifRoute.destination, createPaletteStatement(ifRoute.kind, () => "if-move")) : ifProgram;
assert(ifInserted.statements[0]?.type === "if" && ifInserted.statements[0].body[0]?.id === "if-move", "palette drop inserts into If body");

const desktopRoute = routeDragEnd(
  { id: "palette:turn", data: { origin: "palette", kind: "turn" } },
  { id: "drop:root:1", data: { location: { containerId: null, index: 1 } } },
  1,
);
assert(desktopRoute.action === "insert" && desktopRoute.destinationSource === "metadata", "desktop metadata route remains supported");

const workspaceRoute = routeDragEnd(
  { id: "node:m1", data: { origin: "workspace", statementId: "m1" } },
  { id: "drop:root:0" },
  1,
);
assert(workspaceRoute.action === "move" && workspaceRoute.statementId === "m1", "workspace moves still require an authored statement ID");

const ifElseCard = createPaletteStatement("ifElse", () => "choice");
assert(ifElseCard.type === "ifElse" && ifElseCard.thenBody.length === 0 && ifElseCard.elseBody.length === 0, "palette creates an empty two-branch If / Else block");
assert(createPaletteStatement("while", () => "while").type === "while", "palette creates While");
assert(createPaletteStatement("repeatUntilGoal", () => "until").type === "repeatUntilGoal", "palette creates Repeat Until Battery");

console.log("editor drag end: 13 tests passed");
