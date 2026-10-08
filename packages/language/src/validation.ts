import type { Program, Statement } from "./ast.js";

export interface ProgramLimits {
  readonly maxBlocks: number;
  readonly maxDepth: number;
  readonly maxRepeatCount: number;
}

export const DEFAULT_PROGRAM_LIMITS: ProgramLimits = {
  maxBlocks: 100,
  maxDepth: 8,
  maxRepeatCount: 100,
};

export type ValidationResult =
  | { readonly ok: true; readonly program: Program }
  | { readonly ok: false; readonly errors: readonly string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateProgram(
  input: unknown,
  limits: ProgramLimits = DEFAULT_PROGRAM_LIMITS,
): ValidationResult {
  const errors: string[] = [];
  let blocks = 0;

  let version: 1 | 2 | 3 | undefined;
  const validatePathCondition = (value: unknown, path: string, canonicalRequired = false): boolean => {
    if (!isRecord(value)) {
      errors.push(`${path} must be a path condition`);
      return false;
    }
    if (value.type === "pathAhead" && !canonicalRequired) return true;
    if (value.type !== "path" || value.direction !== "ahead" && value.direction !== "left" && value.direction !== "right") {
      errors.push(`${path} must be path ahead, left, or right`);
      return false;
    }
    if (version !== 3) {
      errors.push(`${path} requires program.version 3`);
      return false;
    }
    return true;
  };
  const validateStatements = (
    value: unknown,
    path: string,
    depth: number,
  ): value is readonly Statement[] => {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return false;
    }
    if (depth > limits.maxDepth) {
      errors.push(`${path} exceeds maximum nesting depth ${limits.maxDepth}`);
      return false;
    }

    let valid = true;
    value.forEach((candidate, index) => {
      const statementPath = `${path}[${index}]`;
      blocks += 1;
      if (blocks > limits.maxBlocks) {
        errors.push(`program exceeds maximum block count ${limits.maxBlocks}`);
        valid = false;
        return;
      }
      if (!isRecord(candidate) || typeof candidate.type !== "string") {
        errors.push(`${statementPath} must be a statement`);
        valid = false;
        return;
      }
      switch (candidate.type) {
        case "moveForward":
        case "turnLeft":
        case "turnRight":
          break;
        case "repeat":
          if (!Number.isInteger(candidate.count) || (candidate.count as number) < 1 || (candidate.count as number) > limits.maxRepeatCount) {
            errors.push(`${statementPath}.count must be an integer from 1 to ${limits.maxRepeatCount}`);
            valid = false;
          }
          if (!validateStatements(candidate.body, `${statementPath}.body`, depth + 1)) valid = false;
          break;
        case "if":
          if (!validatePathCondition(candidate.condition, `${statementPath}.condition`)) valid = false;
          if (!validateStatements(candidate.body, `${statementPath}.body`, depth + 1)) valid = false;
          break;
        case "ifElse":
          if (version !== 2 && version !== 3) {
            errors.push(`${statementPath}.type requires program.version 2 or 3`);
            valid = false;
          }
          if (!validatePathCondition(candidate.condition, `${statementPath}.condition`)) valid = false;
          if (!validateStatements(candidate.thenBody, `${statementPath}.thenBody`, depth + 1)) valid = false;
          if (!validateStatements(candidate.elseBody, `${statementPath}.elseBody`, depth + 1)) valid = false;
          break;
        case "while":
          if (version !== 3) {
            errors.push(`${statementPath}.type requires program.version 3`);
            valid = false;
          }
          if (!validatePathCondition(candidate.condition, `${statementPath}.condition`, true)) valid = false;
          if (!validateStatements(candidate.body, `${statementPath}.body`, depth + 1)) valid = false;
          break;
        case "repeatUntilGoal":
          if (version !== 3) {
            errors.push(`${statementPath}.type requires program.version 3`);
            valid = false;
          }
          if (!validateStatements(candidate.body, `${statementPath}.body`, depth + 1)) valid = false;
          break;
        default:
          errors.push(`${statementPath}.type is not supported`);
          valid = false;
      }
    });
    return valid;
  };

  if (!isRecord(input)) return { ok: false, errors: ["program must be an object"] };
  if (input.version !== 1 && input.version !== 2 && input.version !== 3) errors.push("program.version must be 1, 2, or 3");
  else version = input.version;
  validateStatements(input.statements, "program.statements", 1);

  return errors.length === 0
    ? { ok: true, program: input as unknown as Program }
    : { ok: false, errors };
}
