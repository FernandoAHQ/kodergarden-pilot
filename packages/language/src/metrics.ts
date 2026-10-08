import type { Program, Statement } from "./ast.js";

const countStatements = (statements: readonly Statement[]): number =>
  statements.reduce(
    (total, statement) =>
      total + 1 + (statement.type === "repeat" || statement.type === "if" || statement.type === "while" || statement.type === "repeatUntilGoal" ? countStatements(statement.body) : statement.type === "ifElse" ? countStatements(statement.thenBody) + countStatements(statement.elseBody) : 0),
    0,
  );

/** Counts authored visual instructions, including control structures, once each. */
export const countBlocks = (program: Program): number => countStatements(program.statements);
