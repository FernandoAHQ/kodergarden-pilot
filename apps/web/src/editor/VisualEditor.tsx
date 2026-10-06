import { useState, type ReactNode } from "react";
import { closestCenter, DndContext, DragOverlay, MeasuringStrategy, MouseSensor, pointerWithin, rectIntersection, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { DEFAULT_PROGRAM_LIMITS } from "@kodergarden/language";
import { useI18n } from "../i18n.js";
import { createEditorId, createPaletteStatement, routeDragEnd, type PaletteKind } from "./dragEnd.js";
import { deleteStatement, findLocation, insertStatement, moveStatement, updateRepeatCount, updateTurn, type EditorLocation, type EditorProgram, type EditorStatement } from "./model.js";

const pathEquals = (a: readonly number[], b: readonly number[] | null): boolean => b !== null && a.length === b.length && a.every((value, index) => value === b[index]);
const canvasDropId = "drop:root:canvas";
const touchFirstCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const precisePointerHits = pointerHits.filter((hit) => hit.id !== canvasDropId);
  if (precisePointerHits.length > 0) return precisePointerHits;
  if (pointerHits.length > 0) return pointerHits;
  const intersections = rectIntersection(args);
  const preciseIntersections = intersections.filter((hit) => hit.id !== canvasDropId);
  if (preciseIntersections.length > 0) return preciseIntersections;
  return intersections.length > 0 ? intersections : closestCenter(args);
};
export type EditorTool = PaletteKind;

function PaletteCard({ kind, icon, title, detail, disabled }: { readonly kind: string; readonly icon: string; readonly title: string; readonly detail: string; readonly disabled: boolean }) {
  const drag = useDraggable({ id: `palette:${kind}`, disabled, data: { origin: "palette", kind } });
  return <button ref={drag.setNodeRef} {...drag.listeners} {...drag.attributes} className={`palette-card palette-card--${kind} ${drag.isDragging ? "is-dragging" : ""}`} style={{ transform: CSS.Translate.toString(drag.transform) }} disabled={disabled}>
    <span className="palette-icon">{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><i className="drag-grip">⠿</i>
  </button>;
}

function DropSlot({ location, roomy = false, tone = "root" }: { readonly location: EditorLocation; readonly roomy?: boolean; readonly tone?: "root" | "repeat" | "if" }) {
  const {t}=useI18n();
  const drop = useDroppable({ id: `drop:${location.containerId ?? "root"}:${location.index}`, data: { location } });
  return <div ref={drop.setNodeRef} className={`drop-slot drop-slot--${tone} ${roomy ? "drop-slot--roomy" : ""} ${drop.isOver ? "is-over" : ""}`}><span>{roomy ? t("editor.dropInside") : tone === "root" ? t("editor.insertProgram") : tone === "if" ? t("editor.insertIf") : t("editor.insertRepeat")}</span></div>;
}

function ProgramCanvas({ endIndex, onClear, children }: { readonly endIndex: number; readonly onClear: () => void; readonly children: ReactNode }) {
  const drop = useDroppable({ id: canvasDropId, data: { location: { containerId: null, index: endIndex } satisfies EditorLocation } });
  return <div ref={drop.setNodeRef} className={`editor-canvas ${drop.isOver ? "is-canvas-over" : ""}`} onClick={(event) => { if (event.target === event.currentTarget) onClear(); }}>{children}</div>;
}

interface NodeProps {
  readonly statement: EditorStatement;
  readonly path: readonly number[];
  readonly activePath: readonly number[] | null;
  readonly conditionResult: { readonly path: readonly number[]; readonly result: boolean } | null;
  readonly selectedId: string | null;
  readonly disabled: boolean;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onTurn: (id: string, direction: "left" | "right") => void;
  readonly onCount: (id: string, count: number) => void;
}

function EditorNode(props: NodeProps) {
  const {t}=useI18n();
  const { statement, path, activePath, conditionResult, selectedId, disabled, onSelect, onDelete, onTurn, onCount } = props;
  const drag = useDraggable({ id: `node:${statement.id}`, disabled, data: { origin: "workspace", statementId: statement.id } });
  const active = pathEquals(path, activePath);
  const selected = statement.id === selectedId;
  const common = `editor-node editor-node--${statement.type} ${active ? "is-executing" : ""} ${selected ? "is-selected" : ""} ${drag.isDragging ? "is-dragging" : ""}`;
  const style = { transform: CSS.Translate.toString(drag.transform) };
  const handle = <button className="node-handle" aria-label={t("editor.dragInstruction")} {...drag.listeners} {...drag.attributes} disabled={disabled}>⠿</button>;
  const remove = <button className="node-remove" aria-label={t("common.remove")} onClick={(event) => { event.stopPropagation(); onDelete(statement.id); }} disabled={disabled}>×</button>;

  if (statement.type === "repeat") return <article ref={drag.setNodeRef} className={common} style={style} onClick={() => onSelect(statement.id)}>
    <header className="repeat-header">{handle}<span className="node-icon">↻</span><strong>{t("editor.repeat")}</strong><input aria-label={t("editor.repeat")} type="number" min="1" max={DEFAULT_PROGRAM_LIMITS.maxRepeatCount} value={statement.count} disabled={disabled} onClick={(event) => event.stopPropagation()} onChange={(event) => onCount(statement.id, Number(event.target.value))} /><span>{t("editor.times")}</span>{remove}</header>
    <div className="repeat-body">
      <DropSlot location={{ containerId: statement.id, index: 0 }} roomy={statement.body.length === 0} tone="repeat" />
      {statement.body.map((child, index) => <div key={child.id}><EditorNode {...props} statement={child} path={[...path, index]} /><DropSlot location={{ containerId: statement.id, index: index + 1 }} tone="repeat" /></div>)}
    </div>
  </article>;

  if (statement.type === "ifPathAhead") {
    const evaluation = conditionResult && pathEquals(path, conditionResult.path) ? conditionResult.result : null;
    return <article ref={drag.setNodeRef} className={`${common} ${evaluation === true ? "condition-true" : evaluation === false ? "condition-false" : ""}`} style={style} onClick={() => onSelect(statement.id)}>
      <header className="if-header">{handle}<span className="node-icon">◇</span><div><strong>{t("editor.if")}</strong><span className="condition-label">{t("editor.pathAhead")}</span></div><span className={`condition-result ${evaluation === null ? "" : "is-visible"}`}>{evaluation === null ? t("editor.check") : evaluation ? `${t("editor.yes")} ✓` : `${t("editor.no")} ×`}</span>{remove}</header>
      <div className="if-body"><div className="branch-label"><span>{t("editor.then")}</span><i /></div><DropSlot location={{ containerId: statement.id, index: 0 }} roomy={statement.body.length === 0} tone="if" />
        {statement.body.map((child, index) => <div key={child.id}><EditorNode {...props} statement={child} path={[...path, index]} /><DropSlot location={{ containerId: statement.id, index: index + 1 }} tone="if" /></div>)}
      </div>
    </article>;
  }

  return <article ref={drag.setNodeRef} className={common} style={style} onClick={() => onSelect(statement.id)}>
    {handle}<span className="node-icon">{statement.type === "moveForward" ? "↑" : statement.direction === "left" ? "↶" : "↷"}</span>
    {statement.type === "moveForward" ? <strong>{t("editor.moveForward")}</strong> : <><strong>{t("editor.turn")}</strong><select aria-label={t("editor.turn")} value={statement.direction} disabled={disabled} onClick={(event) => event.stopPropagation()} onChange={(event) => onTurn(statement.id, event.target.value as "left" | "right")}><option value="left">{t("editor.left")}</option><option value="right">{t("editor.right")}</option></select></>}
    <span className="execution-pip" />{remove}
  </article>;
}

export function VisualEditor({ program, allowed, onChange, activePath, conditionResult, disabled, onUndo, onRedo, canUndo, canRedo, onRestore }: { readonly program: EditorProgram; readonly allowed:readonly EditorTool[]; readonly onChange: (program: EditorProgram) => void; readonly activePath: readonly number[] | null; readonly conditionResult: { readonly path: readonly number[]; readonly result: boolean } | null; readonly disabled: boolean; readonly onUndo: () => void; readonly onRedo: () => void; readonly canUndo: boolean; readonly canRedo: boolean; readonly onRestore: () => void }) {
  const {t}=useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 4 } }),
  );
  const change = (next: EditorProgram): void => { if (next !== program) onChange(next); };
  const remove = (id: string): void => { change(deleteStatement(program, id)); setSelectedId(null); };
  const insert = (kind: PaletteKind, location: EditorLocation, trigger: string): void => {
    let statement: EditorStatement;
    let next: EditorProgram;
    try {
      statement = createPaletteStatement(kind, createEditorId);
      next = insertStatement(program, location, statement);
    } catch (error) {
      console.error("Editor insertion failed", { trigger, kind, location, error });
      return;
    }
    change(next);
  };
  const endDrag = ({ active, over }: DragEndEvent): void => {
    setDragLabel(null);
    const activeData = active.data.current;
    const overData = over?.data.current;
    const route = routeDragEnd(
      { id: active.id, ...(activeData ? { data: activeData } : {}) },
      over ? { id: over.id, ...(overData ? { data: overData } : {}) } : null,
      program.statements.length,
    );
    if (route.action === "reject") return;
    if (route.action === "insert") { insert(route.kind, route.destination, "drag end"); return; }
    if (route.action === "move") {
      const from = findLocation(program, route.statementId);
      if (from) {
        const next = moveStatement(program, from, route.destination);
        change(next);
      }
    }
  };
  const startDrag = ({ active }: DragStartEvent): void => {
    const origin = active.data.current?.origin;
    setDragLabel(origin === "palette" ? String(active.data.current?.kind) : "instruction");
  };

  return <DndContext sensors={sensors} collisionDetection={touchFirstCollision} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }} onDragStart={startDrag} onDragEnd={endDrag} onDragCancel={() => setDragLabel(null)}>
    <aside className="instruction-palette">
      <div className="section-kicker">{t("editor.palette")}</div><h2>{t("editor.blocks")}</h2><p>{t("editor.drag")}</p>
      {allowed.some(x=>x==="moveForward"||x==="turn")&&<><h3>{t("editor.movement")}</h3>{allowed.includes("moveForward")&&<PaletteCard kind="moveForward" icon="↑" title={t("editor.moveForward")} detail={t("editor.moveDetail")} disabled={disabled} />}{allowed.includes("turn")&&<PaletteCard kind="turn" icon="↷" title={t("editor.turn")} detail={t("editor.turnDetail")} disabled={disabled} />}</>}
      {allowed.includes("repeat")&&<><h3>{t("editor.control")}</h3><PaletteCard kind="repeat" icon="↻" title={t("editor.repeat")} detail={t("editor.repeatDetail")} disabled={disabled} /></>}
      {allowed.includes("ifPathAhead")&&<><h3>{t("editor.logic")}</h3><PaletteCard kind="ifPathAhead" icon="◇" title={t("editor.ifPathAhead")} detail={t("editor.ifDetail")} disabled={disabled} /></>}
      <div className="palette-tip"><span>✦</span><p>{t("editor.tip")}</p></div>
    </aside>
    <section className="program-editor" tabIndex={0} onKeyDown={(event) => { if (!disabled && selectedId && (event.key === "Delete" || event.key === "Backspace")) { event.preventDefault(); remove(selectedId); } }}>
      <div className="editor-heading"><div><div className="section-kicker">{t("editor.yourProgram")}</div><h2>{t("editor.route")}</h2></div><div className="editor-actions"><button onClick={onUndo} disabled={!canUndo || disabled} title={t("common.undo")}>↶</button><button onClick={onRedo} disabled={!canRedo || disabled} title={t("common.redo")}>↷</button><button onClick={onRestore} disabled={disabled}>{t("common.restore")}</button></div></div>
      <ProgramCanvas endIndex={program.statements.length} onClear={() => setSelectedId(null)}>
        <DropSlot location={{ containerId: null, index: 0 }} roomy={program.statements.length === 0} />
        {program.statements.map((statement, index) => <div key={statement.id}><EditorNode statement={statement} path={[index]} activePath={activePath} conditionResult={conditionResult} selectedId={selectedId} disabled={disabled} onSelect={setSelectedId} onDelete={remove} onTurn={(id, direction) => change(updateTurn(program, id, direction))} onCount={(id, count) => change(updateRepeatCount(program, id, count))} /><DropSlot location={{ containerId: null, index: index + 1 }} /></div>)}
      </ProgramCanvas>
      <div className="editor-foot"><span>{t("editor.topLevel",{count:program.statements.length})}</span><span>{selectedId ? t("editor.selected") : t("editor.selectHint")}</span></div>
    </section>
    <DragOverlay>{dragLabel && <div className={`drag-preview drag-preview--${dragLabel}`}>{dragLabel === "moveForward" ? `↑ ${t("editor.moveForward")}` : dragLabel === "turn" ? `↷ ${t("editor.turn")}` : dragLabel === "repeat" ? `↻ ${t("editor.repeat")}` : dragLabel === "ifPathAhead" ? `◇ ${t("editor.ifPathAhead")}` : t("editor.dragInstruction")}</div>}</DragOverlay>
  </DndContext>;
}
