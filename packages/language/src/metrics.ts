import type { Program, Statement } from "./ast.js";

const countStatements = (statements: readonly Statement[]): number =>
  statements.reduce(
    (total, statement) =>
      total + 1 + (statement.type === "repeat" || statement.type === "if" ? countStatements(statement.body) : 0),
    0,
  );

/** Counts authored visual instructions, including control structures, once each. */
export const countBlocks = (program: Program): number => countStatements(program.statements);
