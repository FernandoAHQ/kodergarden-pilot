export type Statement =
  | { readonly type: "moveForward" }
  | { readonly type: "turnLeft" }
  | { readonly type: "turnRight" }
  | { readonly type: "collect" }
  | {
      readonly type: "repeat";
      readonly count: number;
      readonly body: readonly Statement[];
    }
  | {
      readonly type: "if";
      readonly condition: Condition;
      readonly body: readonly Statement[];
    }
  | {
      readonly type: "ifElse";
      readonly condition: Condition;
      readonly thenBody: readonly Statement[];
      readonly elseBody: readonly Statement[];
    }
  | {
      readonly type: "while";
      readonly condition: PathCondition;
      readonly body: readonly Statement[];
    }
  | {
      readonly type: "repeatUntilGoal";
      readonly body: readonly Statement[];
    };

export type PathDirection = "ahead" | "left" | "right";
export type LegacyPathCondition = { readonly type: "pathAhead" };
export type PathCondition = { readonly type: "path"; readonly direction: PathDirection };
export type ItemCondition = { readonly type: "itemHere" };
export type Condition = LegacyPathCondition | PathCondition | ItemCondition;
export type EvaluatedCondition = PathCondition | ItemCondition | { readonly type: "goalReached" };

export interface Program {
  readonly version: 1 | 2 | 3 | 4;
  readonly statements: readonly Statement[];
}

export const program = (statements: readonly Statement[]): Program => ({
  version: 1,
  statements,
});

export const programV2 = (statements: readonly Statement[]): Program => ({
  version: 2,
  statements,
});

export const programV3 = (statements: readonly Statement[]): Program => ({
  version: 3,
  statements,
});

export const programV4 = (statements: readonly Statement[]): Program => ({
  version: 4,
  statements,
});
