import { useI18n } from "../i18n.js";
import { useState, type CSSProperties } from "react";
import type { AdminDraftChallenge } from "@kodergarden/shared";
import type { Program } from "@kodergarden/language";
import type { Direction, GridWorldDefinition } from "@kodergarden/engine";
import { VisualEditor } from "../editor/VisualEditor.js";
import {
  fromExecutableProgram,
  toExecutableProgram,
  type EditorProgram,
} from "../editor/model.js";

type Challenge = AdminDraftChallenge;
type PaintMode = "blocked" | "robot" | "goal" | "item";

let editorIdentity = 0;
const editorProgram = (program: Program): EditorProgram =>
  fromExecutableProgram(program, () => `admin-${editorIdentity++}`);

function resizeWorld(
  world: GridWorldDefinition,
  dimension: "width" | "height",
  value: number,
): GridWorldDefinition {
  const width = dimension === "width" ? value : world.width;
  const height = dimension === "height" ? value : world.height;
  const inside = ({ x, y }: { x: number; y: number }) =>
    x >= 0 && y >= 0 && x < width && y < height;
  const clamp = ({ x, y }: { x: number; y: number }) => ({
    x: Math.min(x, width - 1),
    y: Math.min(y, height - 1),
  });
  const robotPosition = clamp(world.robot);
  let goal = clamp(world.goal);
  if (goal.x === robotPosition.x && goal.y === robotPosition.y) {
    goal = robotPosition.x + 1 < width
      ? { x: robotPosition.x + 1, y: robotPosition.y }
      : { x: Math.max(0, robotPosition.x - 1), y: robotPosition.y };
  }
  const shiftingHedges = world.shiftingHedges?.filter((hedge) => inside(hedge.from) && inside(hedge.to) &&
    !(hedge.from.x === robotPosition.x && hedge.from.y === robotPosition.y) &&
    !(hedge.to.x === robotPosition.x && hedge.to.y === robotPosition.y) &&
    !(hedge.from.x === goal.x && hedge.from.y === goal.y) &&
    !(hedge.to.x === goal.x && hedge.to.y === goal.y));
  const items = world.items?.filter((item) => inside(item.position));
  return {
    width,
    height,
    blocked: world.blocked.filter(
      (cell) => inside(cell) &&
        !(cell.x === robotPosition.x && cell.y === robotPosition.y) &&
        !(cell.x === goal.x && cell.y === goal.y),
    ),
    robot: { ...robotPosition, direction: world.robot.direction },
    goal,
    ...(shiftingHedges ? { shiftingHedges } : {}),
    ...(items ? { items } : {}),
  };
}

function ShiftingHedgeEditor({ world, onChange }: { world: GridWorldDefinition; onChange: (world: GridWorldDefinition) => void }) {
  const hedges = world.shiftingHedges ?? [];
  const update = (index: number, field: "id" | "fromX" | "fromY" | "toX" | "toY", raw: string) => {
    const next = hedges.map((hedge, current) => {
      if (current !== index) return hedge;
      if (field === "id") return { ...hedge, id: raw };
      const value = Number(raw) || 0;
      if (field === "fromX") return { ...hedge, from: { ...hedge.from, x: value } };
      if (field === "fromY") return { ...hedge, from: { ...hedge.from, y: value } };
      if (field === "toX") return { ...hedge, to: { ...hedge.to, x: value } };
      return { ...hedge, to: { ...hedge.to, y: value } };
    });
    onChange({ ...world, shiftingHedges: next });
  };
  const add = () => {
    const unavailable = new Set([...world.blocked, world.robot, world.goal, ...(world.items??[]).map(item=>item.position), ...hedges.flatMap((hedge) => [hedge.from, hedge.to])].map((cell) => `${cell.x},${cell.y}`));
    const open = Array.from({ length: world.width * world.height }, (_, index) => ({ x:index%world.width,y:Math.floor(index/world.width) })).filter((cell) => !unavailable.has(`${cell.x},${cell.y}`));
    if (open.length < 2) return;
    onChange({ ...world, shiftingHedges:[...hedges,{id:`shifting-hedge-${hedges.length+1}`,from:open[0]!,to:open[1]!}] });
  };
  return <div className="admin-shifting-hedges">
    <div><strong>Shifting hedges</strong><small>Each hedge visibly moves from its start to its target before Pip executes the first block.</small></div>
    {hedges.map((hedge,index)=><div className="admin-shifting-row" key={`${hedge.id}-${index}`}>
      <label>ID<input value={hedge.id} onChange={(event)=>update(index,"id",event.target.value)}/></label>
      <span>From</span><label>X<input type="number" min="0" max={world.width-1} value={hedge.from.x} onChange={(event)=>update(index,"fromX",event.target.value)}/></label><label>Y<input type="number" min="0" max={world.height-1} value={hedge.from.y} onChange={(event)=>update(index,"fromY",event.target.value)}/></label>
      <span>To</span><label>X<input type="number" min="0" max={world.width-1} value={hedge.to.x} onChange={(event)=>update(index,"toX",event.target.value)}/></label><label>Y<input type="number" min="0" max={world.height-1} value={hedge.to.y} onChange={(event)=>update(index,"toY",event.target.value)}/></label>
      <button className="danger-button" onClick={()=>onChange({...world,shiftingHedges:hedges.filter((_,current)=>current!==index)})}>Remove</button>
    </div>)}
    <button className="admin-secondary" onClick={add}>+ Add shifting hedge</button>
  </div>;
}

function GridPainter({
  label,
  world,
  onChange,
}: {
  label: string;
  world: GridWorldDefinition;
  onChange: (world: GridWorldDefinition) => void;
}) {
  const [mode, setMode] = useState<PaintMode>("blocked");
  const blocked = new Set(world.blocked.map((cell) => `${cell.x},${cell.y}`));
  const cells = Array.from({ length: world.width * world.height }, (_, index) => ({
    x: index % world.width,
    y: Math.floor(index / world.width),
  }));
  const paint = (x: number, y: number) => {
    if (mode === "item") {
      const existing = (world.items ?? []).find((item) => item.position.x === x && item.position.y === y);
      const items = existing ? (world.items ?? []).filter((item) => item !== existing) : [...(world.items ?? []), { id: `packet-${Date.now()}-${x}-${y}`, position: { x, y } }];
      onChange({ ...world, blocked: world.blocked.filter((cell) => cell.x !== x || cell.y !== y), items });
      return;
    }
    if (mode === "robot") {
      if (world.goal.x === x && world.goal.y === y) return;
      onChange({
        ...world,
        blocked: world.blocked.filter((cell) => cell.x !== x || cell.y !== y),
        robot: { x, y, direction: world.robot.direction },
      });
      return;
    }
    if (mode === "goal") {
      if (world.robot.x === x && world.robot.y === y) return;
      onChange({
        ...world,
        blocked: world.blocked.filter((cell) => cell.x !== x || cell.y !== y),
        goal: { x, y },
      });
      return;
    }
    if ((world.robot.x === x && world.robot.y === y) || (world.goal.x === x && world.goal.y === y) || (world.items ?? []).some(item=>item.position.x===x&&item.position.y===y)) return;
    const key = `${x},${y}`;
    onChange({
      ...world,
      blocked: blocked.has(key)
        ? world.blocked.filter((cell) => cell.x !== x || cell.y !== y)
        : [...world.blocked, { x, y }],
    });
  };
  return (
    <section className="admin-grid-editor">
      <div className="admin-grid-heading">
        <div><strong>{label}</strong><small>{world.width} × {world.height}</small></div>
        <div className="admin-grid-size">
          {(["width", "height"] as const).map((dimension) => (
            <label key={dimension}>{dimension}<input type="number" min="2" max="12" value={world[dimension]} onChange={(event) => onChange(resizeWorld(world, dimension, Math.max(2, Math.min(12, Number(event.target.value) || 2))))}/></label>
          ))}
        </div>
      </div>
      <div className="admin-paint-tools">
        {(["blocked", "robot", "goal", "item"] as const).map((value) => <button key={value} className={mode === value ? "is-active" : ""} onClick={() => setMode(value)}>{value === "blocked" ? "Obstacle" : value === "robot" ? "Robot start" : value === "goal" ? "Goal" : "Seed packet"}</button>)}
        <label>Facing<select value={world.robot.direction} onChange={(event) => onChange({ ...world, robot: { ...world.robot, direction: event.target.value as Direction } })}>{(["north", "east", "south", "west"] as const).map((direction) => <option key={direction}>{direction}</option>)}</select></label>
      </div>
      <div className="admin-paint-grid" style={{ "--admin-columns": world.width } as CSSProperties}>
        {cells.map(({ x, y }) => {
          const key = `${x},${y}`;
          const robot = world.robot.x === x && world.robot.y === y;
          const goal = world.goal.x === x && world.goal.y === y;
          const item = (world.items ?? []).some(packet=>packet.position.x===x&&packet.position.y===y);
          return <button type="button" key={key} className={blocked.has(key) ? "is-blocked" : robot ? "is-robot" : goal ? "is-goal" : item ? "is-item" : ""} aria-label={`${x}, ${y}${robot ? " robot" : goal ? " goal" : item ? " seed packet" : blocked.has(key) ? " obstacle" : " open"}`} onClick={() => paint(x, y)}>{robot ? "▲" : goal ? "★" : item ? "✦" : blocked.has(key) ? "×" : ""}</button>;
        })}
      </div>
      <ShiftingHedgeEditor world={world} onChange={onChange}/>
    </section>
  );
}

function ProgramEditor({ title, description, source, allowed, onChange }: { title: string; description: string; source: Program; allowed: Challenge["allowed"]; onChange: (program: Program) => void }) {
  const [program, setProgram] = useState(() => editorProgram(source));
  const change = (next: EditorProgram) => {
    setProgram(next);
    onChange(toExecutableProgram(next));
  };
  return <div className="admin-starter-editor"><h3>{title}</h3><p>{description}</p><VisualEditor program={program} allowed={allowed} onChange={change} activePath={null} conditionResult={null} disabled={false} onUndo={() => undefined} onRedo={() => undefined} canUndo={false} canRedo={false} onRestore={() => change({ statements: [] })}/></div>;
}

export function ChallengeMechanicsEditor({ challenge, onUpdate }: { challenge: Challenge; onUpdate: (change: Partial<Challenge>) => void }) {
  const {t}=useI18n();
  const policy=challenge.assessment??{scope:"case-family" as const,correctness:"legacy" as const,maxCollisions:null,occasion:"initial" as const};
  const updateLayout = (index: number, world: GridWorldDefinition) => onUpdate({ layouts: challenge.layouts.map((layout, current) => current === index ? { ...layout, world } : layout) });
  const addLayout = () => {
    const used = new Set(challenge.layouts.map((layout) => layout.slug));
    let number = challenge.layouts.length + 1;
    while (used.has(`layout-${number}`)) number += 1;
    onUpdate({ layouts: [...challenge.layouts, { slug: `layout-${number}`, order: challenge.layouts.length + 1, world: structuredClone(challenge.world) }] });
  };
  return <div className="challenge-mechanics-editor">
    <fieldset><legend>{t("assessment.settings")}</legend>
      <label>{t("assessment.activity")}<select value={challenge.type??"build"} onChange={event=>onUpdate({type:event.target.value as NonNullable<Challenge["type"]>,assessment:{...policy,scope:event.target.value==="predict"?"active-case":event.target.value==="family"?"case-family":policy.scope}})}>{["build","predict","debug","family"].map(value=><option key={value} value={value}>{t(`assessment.type.${value}`)}</option>)}</select></label>
      <label>{t("assessment.scope")}<select value={policy.scope} onChange={event=>onUpdate({assessment:{...policy,scope:event.target.value as typeof policy.scope}})}>{["active-case","case-family"].map(value=><option key={value} value={value}>{t(`assessment.scope.${value}`)}</option>)}</select></label>
      <label>{t("assessment.correctness")}<select value={policy.correctness} onChange={event=>onUpdate({assessment:{...policy,correctness:event.target.value as typeof policy.correctness}})}>{["legacy","discovery"].map(value=><option key={value} value={value}>{t(`assessment.correctness.${value}`)}</option>)}</select></label>
      <label>{t("assessment.occasion")}<select value={policy.occasion} onChange={event=>onUpdate({assessment:{...policy,occasion:event.target.value as typeof policy.occasion}})}>{["initial","fresh","delayed"].map(value=><option key={value} value={value}>{t(`assessment.occasion.${value}`)}</option>)}</select></label>
      <label>{t("assessment.collisions")}<input type="number" min={0} max={1000} value={policy.maxCollisions??""} onChange={event=>onUpdate({assessment:{...policy,maxCollisions:event.target.value===""?null:Number(event.target.value)}})}/></label>
    </fieldset><h3>Grid and layouts</h3>
    <p>Edit the default grid. Add variants when learners should receive an unpredictable layout.</p>
    <GridPainter label="Default layout" world={challenge.world} onChange={(world) => onUpdate({ world })}/>
    {challenge.layouts.map((layout, index) => <div className="admin-layout-variant" key={layout.slug}>
      <div className="admin-layout-toolbar"><label>Layout slug<input value={layout.slug} onChange={(event) => onUpdate({ layouts: challenge.layouts.map((item, current) => current === index ? { ...item, slug: event.target.value } : item) })}/></label><button className="danger-button" onClick={() => onUpdate({ layouts: challenge.layouts.filter((_, current) => current !== index).map((item, current) => ({ ...item, order: current + 1 })) })}>Remove layout</button></div>
      <GridPainter label={`Dynamic layout ${index + 1}`} world={layout.world} onChange={(world) => updateLayout(index, world)}/>
    </div>)}
    <button className="admin-secondary" onClick={addLayout}>+ Add dynamic layout</button>
    <ProgramEditor key={`${challenge.slug}-starter`} title="Starter program" description="Blocks placed here appear in the learner workspace when this challenge opens." source={challenge.starter} allowed={challenge.allowed} onChange={(starter) => onUpdate({ starter })}/>
    <ProgramEditor key={`${challenge.slug}-reference`} title="Reference solution" description="This program must solve the default grid and every dynamic layout before publishing." source={challenge.referenceSolution ?? { version: 1, statements: [] }} allowed={challenge.allowed} onChange={(referenceSolution) => onUpdate({ referenceSolution })}/>
  </div>;
}
