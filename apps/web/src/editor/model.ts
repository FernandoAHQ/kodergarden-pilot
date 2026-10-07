import { program, programV2, type Program, type Statement } from "@kodergarden/language";

export type EditorStatement =
  | { readonly id: string; readonly type: "moveForward" }
  | { readonly id: string; readonly type: "turn"; readonly direction: "left" | "right" }
  | { readonly id: string; readonly type: "repeat"; readonly count: number; readonly body: readonly EditorStatement[] }
  | { readonly id: string; readonly type: "ifPathAhead"; readonly body: readonly EditorStatement[] }
  | { readonly id: string; readonly type: "ifElsePathAhead"; readonly thenBody: readonly EditorStatement[]; readonly elseBody: readonly EditorStatement[] };
export interface EditorProgram { readonly statements: readonly EditorStatement[] }
export interface EditorLocation { readonly containerId: string | null; readonly index: number }
export interface EditorHistory { readonly present: EditorProgram; readonly past: readonly EditorProgram[]; readonly future: readonly EditorProgram[] }
export const createHistory = (present: EditorProgram): EditorHistory => ({ present, past: [], future: [] });
export const commitHistory = (history: EditorHistory, present: EditorProgram): EditorHistory => ({ present, past: [...history.past.slice(-39), history.present], future: [] });
export const undoHistory = (history: EditorHistory): EditorHistory => {
  const present = history.past.at(-1);
  return present ? { present, past: history.past.slice(0, -1), future: [history.present, ...history.future] } : history;
};
export const redoHistory = (history: EditorHistory): EditorHistory => {
  const present = history.future[0];
  return present ? { present, past: [...history.past, history.present], future: history.future.slice(1) } : history;
};

const mapTree = (statements: readonly EditorStatement[], targetId: string, transform: (statement: EditorStatement) => EditorStatement): readonly EditorStatement[] =>
  statements.map((statement) => {
    if (statement.id === targetId) return transform(statement);
    if (statement.type === "repeat" || statement.type === "ifPathAhead") return { ...statement, body: mapTree(statement.body, targetId, transform) };
    if (statement.type === "ifElsePathAhead") return { ...statement, thenBody: mapTree(statement.thenBody, targetId, transform), elseBody: mapTree(statement.elseBody, targetId, transform) };
    return statement;
  });

export const thenContainerId = (id: string): string => `then:${id}`;
export const elseContainerId = (id: string): string => `else:${id}`;

export const getContainer = (editor: EditorProgram, containerId: string | null): readonly EditorStatement[] | undefined => {
  if (containerId === null) return editor.statements;
  const visit = (statements: readonly EditorStatement[]): readonly EditorStatement[] | undefined => {
    for (const statement of statements) {
      if (statement.type === "repeat" || statement.type === "ifPathAhead") {
        if (statement.id === containerId) return statement.body;
        const nested = visit(statement.body);
        if (nested) return nested;
      } else if (statement.type === "ifElsePathAhead") {
        if (thenContainerId(statement.id) === containerId) return statement.thenBody;
        if (elseContainerId(statement.id) === containerId) return statement.elseBody;
        const nested = visit(statement.thenBody) ?? visit(statement.elseBody);
        if (nested) return nested;
      }
    }
    return undefined;
  };
  return visit(editor.statements);
};

const replaceContainer = (editor: EditorProgram, containerId: string | null, statements: readonly EditorStatement[]): EditorProgram => {
  if (containerId === null) return { statements };
  if (containerId.startsWith("then:")) return { statements: mapTree(editor.statements, containerId.slice(5), (statement) => statement.type === "ifElsePathAhead" ? { ...statement, thenBody: statements } : statement) };
  if (containerId.startsWith("else:")) return { statements: mapTree(editor.statements, containerId.slice(5), (statement) => statement.type === "ifElsePathAhead" ? { ...statement, elseBody: statements } : statement) };
  return { statements: mapTree(editor.statements, containerId, (statement) => statement.type === "repeat" || statement.type === "ifPathAhead" ? { ...statement, body: statements } : statement) };
};

export function insertStatement(editor: EditorProgram, location: EditorLocation, statement: EditorStatement): EditorProgram {
  const container = getContainer(editor, location.containerId);
  if (!container) return editor;
  const index = Math.max(0, Math.min(location.index, container.length));
  return replaceContainer(editor, location.containerId, [...container.slice(0, index), statement, ...container.slice(index)]);
}

export function removeStatement(editor: EditorProgram, location: EditorLocation): { readonly editor: EditorProgram; readonly removed?: EditorStatement } {
  const container = getContainer(editor, location.containerId);
  if (!container || location.index < 0 || location.index >= container.length) return { editor };
  const removed = container[location.index];
  return { editor: replaceContainer(editor, location.containerId, container.filter((_, index) => index !== location.index)), ...(removed ? { removed } : {}) };
}

const containsId = (statement: EditorStatement, id: string): boolean => statement.id === id
  || ((statement.type === "repeat" || statement.type === "ifPathAhead") && statement.body.some((child) => containsId(child, id)))
  || (statement.type === "ifElsePathAhead" && [...statement.thenBody, ...statement.elseBody].some((child) => containsId(child, id)));

export function moveStatement(editor: EditorProgram, from: EditorLocation, to: EditorLocation): EditorProgram {
  const source = getContainer(editor, from.containerId)?.[from.index];
  if (!source || (to.containerId !== null && containsId(source, to.containerId))) return editor;
  const removed = removeStatement(editor, from);
  if (!removed.removed) return editor;
  const index = from.containerId === to.containerId && from.index < to.index ? to.index - 1 : to.index;
  return insertStatement(removed.editor, { ...to, index }, removed.removed);
}

export const deleteStatement = (editor: EditorProgram, id: string): EditorProgram => {
  const remove = (statements: readonly EditorStatement[]): readonly EditorStatement[] => statements.filter((statement) => statement.id !== id).map((statement) => statement.type === "repeat" || statement.type === "ifPathAhead" ? { ...statement, body: remove(statement.body) } : statement.type === "ifElsePathAhead" ? { ...statement, thenBody: remove(statement.thenBody), elseBody: remove(statement.elseBody) } : statement);
  return { statements: remove(editor.statements) };
};
export const updateTurn = (editor: EditorProgram, id: string, direction: "left" | "right"): EditorProgram => ({ statements: mapTree(editor.statements, id, (statement) => statement.type === "turn" ? { ...statement, direction } : statement) });
export const updateRepeatCount = (editor: EditorProgram, id: string, count: number, max = 100): EditorProgram => ({ statements: mapTree(editor.statements, id, (statement) => statement.type === "repeat" ? { ...statement, count: Math.max(1, Math.min(max, Math.round(count))) } : statement) });

const toStatement = (statement: EditorStatement): Statement => statement.type === "moveForward" ? { type: "moveForward" } : statement.type === "turn" ? { type: statement.direction === "left" ? "turnLeft" : "turnRight" } : statement.type === "repeat" ? { type: "repeat", count: statement.count, body: statement.body.map(toStatement) } : statement.type === "ifPathAhead" ? { type: "if", condition: { type: "pathAhead" }, body: statement.body.map(toStatement) } : { type: "ifElse", condition: { type: "pathAhead" }, thenBody: statement.thenBody.map(toStatement), elseBody: statement.elseBody.map(toStatement) };
const containsIfElse = (statements: readonly EditorStatement[]): boolean => statements.some((statement) => statement.type === "ifElsePathAhead" || (statement.type === "repeat" || statement.type === "ifPathAhead") && containsIfElse(statement.body));
export const toExecutableProgram = (editor: EditorProgram): Program => (containsIfElse(editor.statements) ? programV2 : program)(editor.statements.map(toStatement));
export const fromExecutableProgram = (source: Program, makeId: () => string): EditorProgram => {
  const convert = (statement: Statement): EditorStatement => {
    if (statement.type === "moveForward") return { id: makeId(), type: "moveForward" };
    if (statement.type === "turnLeft" || statement.type === "turnRight") return { id: makeId(), type: "turn", direction: statement.type === "turnLeft" ? "left" : "right" };
    if (statement.type === "repeat") return { id: makeId(), type: "repeat", count: statement.count, body: statement.body.map(convert) };
    if (statement.type === "if") return { id: makeId(), type: "ifPathAhead", body: statement.body.map(convert) };
    return { id: makeId(), type: "ifElsePathAhead", thenBody: statement.thenBody.map(convert), elseBody: statement.elseBody.map(convert) };
  };
  return { statements: source.statements.map(convert) };
};
export const findLocation = (editor: EditorProgram, id: string): EditorLocation | undefined => {
  const visit = (statements: readonly EditorStatement[], containerId: string | null): EditorLocation | undefined => {
    for (let index = 0; index < statements.length; index += 1) {
      const statement = statements[index]!;
      if (statement.id === id) return { containerId, index };
      if (statement.type === "repeat" || statement.type === "ifPathAhead") { const nested = visit(statement.body, statement.id); if (nested) return nested; }
      if (statement.type === "ifElsePathAhead") {
        const nested = visit(statement.thenBody, thenContainerId(statement.id)) ?? visit(statement.elseBody, elseContainerId(statement.id));
        if (nested) return nested;
      }
    }
    return undefined;
  };
  return visit(editor.statements, null);
};
