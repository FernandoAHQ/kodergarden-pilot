import type { ExecutionPath } from "@kodergarden/engine";
import type { Statement } from "@kodergarden/language";

interface ProgramViewProps {
  readonly statements: readonly Statement[];
  readonly activePath: ExecutionPath | null;
}

const samePath = (left: ExecutionPath, right: ExecutionPath | null): boolean =>
  right !== null && left.length === right.length && left.every((part, index) => part === right[index]);

const icon: Record<"moveForward" | "turnLeft" | "turnRight" | "collect", string> = {
  moveForward: "↑",
  turnLeft: "↶",
  turnRight: "↷",
  collect: "✦",
};

function StatementCard({ statement, path, activePath }: { readonly statement: Statement; readonly path: ExecutionPath; readonly activePath: ExecutionPath | null }) {
  const active = samePath(path, activePath);
  if (statement.type === "repeat" || statement.type === "if" || statement.type === "ifElse" || statement.type === "while" || statement.type === "repeatUntilGoal") {
    const primaryBody = statement.type === "ifElse" ? statement.thenBody : statement.body;
    const condition = statement.type === "if" || statement.type === "ifElse" || statement.type === "while" ? statement.condition.type === "itemHere" ? "item here" : statement.condition.type === "pathAhead" ? "path ahead" : `path ${statement.condition.direction}` : "";
    return (
      <div className={`program-control ${active ? "is-active" : ""}`} data-path={path.join(".")}>
        <div className="program-control__header">
          <span className="statement-icon">{statement.type === "repeat" ? "↻" : statement.type === "while" ? "⟳" : statement.type === "repeatUntilGoal" ? "◎" : "?"}</span>
          <span>{statement.type === "repeat" ? "REPEAT" : statement.type === "ifElse" ? "IF / ELSE" : statement.type === "while" ? "WHILE" : statement.type === "repeatUntilGoal" ? "REPEAT UNTIL BATTERY" : "IF"}</span>
          <strong>{statement.type === "repeat" ? `${statement.count} times` : condition}</strong>
          <span className="running-dot" aria-hidden="true" />
        </div>
        <div className="program-control__body">
          {primaryBody.map((child, index) => (
            <StatementCard key={index} statement={child} path={statement.type === "ifElse" ? [...path, "then", index] : [...path, index]} activePath={activePath} />
          ))}
        </div>
        {statement.type === "ifElse" && <div className="program-control__body" data-branch="else">
          {statement.elseBody.map((child, index) => <StatementCard key={index} statement={child} path={[...path, "else", index]} activePath={activePath} />)}
        </div>}
      </div>
    );
  }

  return (
    <div className={`program-statement ${active ? "is-active" : ""}`} data-path={path.join(".")}>
      <span className="statement-icon">{icon[statement.type]}</span>
      <span>{statement.type === "moveForward" ? "MOVE FORWARD" : statement.type === "collect" ? "COLLECT" : statement.type === "turnLeft" ? "TURN LEFT" : "TURN RIGHT"}</span>
      <span className="running-dot" aria-hidden="true" />
    </div>
  );
}

export function ProgramView({ statements, activePath }: ProgramViewProps) {
  return (
    <div className="program-list" aria-label="Program instructions">
      {statements.map((statement, index) => (
        <StatementCard key={index} statement={statement} path={[index]} activePath={activePath} />
      ))}
    </div>
  );
}
