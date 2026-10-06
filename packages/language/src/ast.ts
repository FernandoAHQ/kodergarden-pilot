export type Statement =
  | { readonly type: "moveForward" }
  | { readonly type: "turnLeft" }
  | { readonly type: "turnRight" }
  | {
      readonly type: "repeat";
      readonly count: number;
      readonly body: readonly Statement[];
    }
  | {
      readonly type: "if";
      readonly condition: Condition;
      readonly body: readonly Statement[];
    };

export type Condition = { readonly type: "pathAhead" };

export interface Program {
  readonly version: 1;
  readonly statements: readonly Statement[];
}

export const program = (statements: readonly Statement[]): Program => ({
  version: 1,
  statements,
});
