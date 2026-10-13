import { useEffect, useRef } from "react";
import type { ExecutionPath } from "@kodergarden/engine";
import type { Program, Statement } from "@kodergarden/language";
import { useI18n } from "../i18n.js";
import type { PlaybackState } from "../playback.js";
import { guidanceToolMeta, type GuidanceOutcome, type GuidanceTool } from "./guidance.js";

export type ActiveGuidance =
  | { readonly kind: "library" }
  | { readonly kind: "orientation" }
  | { readonly kind: "family" }
  | { readonly kind: "block"; readonly tool: GuidanceTool; readonly mode: "reference" | "coach" | "anatomy" }
  | { readonly kind: "hint"; readonly outcome: GuidanceOutcome; readonly level: number };

const toolKey = (tool: GuidanceTool): string => `guidance.${tool}`;

export function PracticeGuidance({ active, allowed, onClose, onOpenTool, onNextHint }: {
  readonly active: ActiveGuidance | null;
  readonly allowed: readonly GuidanceTool[];
  readonly onClose: () => void;
  readonly onOpenTool: (tool: GuidanceTool) => void;
  readonly onNextHint: () => void;
}) {
  const { t } = useI18n();
  const panel = useRef<HTMLElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!active) {
      previousFocus.current?.focus();
      previousFocus.current = null;
      return;
    }
    if (previousFocus.current === null) previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => panel.current?.focus());
  }, [active?.kind, active?.kind === "block" ? active.tool : active?.kind === "hint" ? `${active.outcome}:${active.level}` : ""]);
  useEffect(() => {
    if (!active) return;
    const escape = (event: KeyboardEvent): void => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [active, onClose]);
  if (!active) return null;

  const title = active.kind === "library" ? t("guidance.library.title")
    : active.kind === "orientation" ? t("guidance.orientation.title")
    : active.kind === "family" ? t("guidance.family.title")
    : active.kind === "hint" ? t("guidance.hintTitle")
    : t(guidanceToolMeta[active.tool].titleKey);

  return <aside ref={panel} className="practice-guidance" role="dialog" aria-modal="false" aria-label={title} tabIndex={-1}>
    <header><div><span className="section-kicker">{active.kind === "hint" ? t("guidance.hintLevel", { level: active.level }) : t("guidance.helpFor")}</span><h2>{title}</h2></div><button className="guidance-close" onClick={onClose} aria-label={t("guidance.close")}>×</button></header>
    <div className="practice-guidance__body">
      {active.kind === "library" && <><p>{t("guidance.library.body")}</p><div className="guidance-library">{[...new Set(allowed)].map(tool => <button key={tool} onClick={() => onOpenTool(tool)}><span>{guidanceToolMeta[tool].icon}</span><strong>{t(guidanceToolMeta[tool].titleKey)}</strong><small>{t(`${toolKey(tool)}.does`)}</small></button>)}</div></>}
      {active.kind === "orientation" && <div className="guidance-coach"><p>{t("guidance.orientation.body")}</p><ol><li>{t("guidance.orientation.step1")}</li><li>{t("guidance.orientation.step2")}</li><li>{t("guidance.orientation.step3")}</li></ol></div>}
      {active.kind === "family" && <div className="guidance-coach"><p>{t("guidance.family.body")}</p><ol><li>{t("guidance.family.step1")}</li><li>{t("guidance.family.step2")}</li><li>{t("guidance.family.step3")}</li></ol></div>}
      {active.kind === "block" && <div className="guidance-definition">
        <div className={`guidance-tool-icon palette-icon palette-icon--${active.tool}`}>{guidanceToolMeta[active.tool].icon}</div>
        {active.mode === "coach" && <p className="guidance-callout">{t("guidance.newBlock")}</p>}
        {active.mode === "anatomy" && <div className="guidance-anatomy"><strong>{t("guidance.anatomy.title")}</strong><p>{t(`guidance.anatomy.${active.tool}`)}</p></div>}
        <dl><div><dt>{t("guidance.does")}</dt><dd>{t(`${toolKey(active.tool)}.does`)}</dd></div><div><dt>{t("guidance.doesNot")}</dt><dd>{t(`${toolKey(active.tool)}.doesNot`)}</dd></div><div><dt>{t("guidance.watch")}</dt><dd>{t(`${toolKey(active.tool)}.watch`)}</dd></div><div><dt>{t("guidance.try")}</dt><dd>{t(`${toolKey(active.tool)}.try`)}</dd></div></dl>
      </div>}
      {active.kind === "hint" && <div className="guidance-hint"><span>{active.level}</span><p>{t(`guidance.hint.${active.outcome}.${active.level}`)}</p>{active.level < 4 && <button onClick={onNextHint}>{t("guidance.nextHint")}</button>}</div>}
    </div>
  </aside>;
}

function statementAtPath(program: Program, path: ExecutionPath): Statement | null {
  let body: readonly Statement[] = program.statements;
  let statement: Statement | null = null;
  for (let index = 0; index < path.length; index += 1) {
    const part = path[index];
    if (typeof part !== "number") continue;
    statement = body[part] ?? null;
    if (!statement) return null;
    const branch = path[index + 1];
    if (statement.type === "ifElse" && (branch === "then" || branch === "else")) {
      body = branch === "then" ? statement.thenBody : statement.elseBody;
      index += 1;
    } else if (statement.type === "repeat" || statement.type === "if" || statement.type === "while" || statement.type === "repeatUntilGoal") body = statement.body;
    else body = [];
  }
  return statement;
}

export function TraceInsight({ playback, program }: { readonly playback: PlaybackState; readonly program: Program }) {
  const { t } = useI18n();
  let title: string | null = null;
  let detail: string | null = null;
  let tone = "neutral";
  if (playback.collision) {
    title = t("guidance.trace.blocked"); detail = t("guidance.trace.blockedDetail"); tone = "warning";
  } else if (playback.collectionError) {
    title = t("guidance.trace.emptyCollect"); detail = t("guidance.trace.emptyCollectDetail"); tone = "warning";
  } else if (playback.status === "limit") {
    title = t("guidance.trace.limit"); detail = t("guidance.trace.limitDetail"); tone = "warning";
  } else if (playback.conditionResult) {
    const condition = playback.conditionResult.condition;
    title = condition.type === "goalReached" ? t("guidance.trace.goalCheck") : condition.type === "itemHere" ? t("editor.itemHere") : t(`editor.path.${condition.direction}`);
    detail = t(playback.conditionResult.result ? "guidance.trace.yes" : "guidance.trace.no");
    tone = playback.conditionResult.result ? "yes" : "no";
  } else if (playback.loop) {
    const statement = statementAtPath(program, playback.loop.path);
    title = t("guidance.trace.loop");
    detail = statement?.type === "repeat" ? t("guidance.trace.loopKnown", { current: playback.loop.iteration, total: statement.count }) : t("guidance.trace.loopOpen", { current: playback.loop.iteration });
  }
  if (!title || !detail) return null;
  return <div className={`trace-insight is-${tone}`} aria-live="polite"><span aria-hidden="true">{tone === "warning" ? "!" : tone === "yes" ? "✓" : tone === "no" ? "×" : "↻"}</span><div><strong>{title}</strong><p>{detail}</p></div></div>;
}
