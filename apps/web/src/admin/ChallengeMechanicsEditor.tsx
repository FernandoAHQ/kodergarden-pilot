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
type PaintMode = "blocked" | "robot" | "goal";

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
  };
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
    if ((world.robot.x === x && world.robot.y === y) || (world.goal.x === x && world.goal.y === y)) return;
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
        {(["blocked", "robot", "goal"] as const).map((value) => <button key={value} className={mode === value ? "is-active" : ""} onClick={() => setMode(value)}>{value === "blocked" ? "Obstacle" : value === "robot" ? "Robot start" : "Goal"}</button>)}
        <label>Facing<select value={world.robot.direction} onChange={(event) => onChange({ ...world, robot: { ...world.robot, direction: event.target.value as Direction } })}>{(["north", "east", "south", "west"] as const).map((direction) => <option key={direction}>{direction}</option>)}</select></label>
      </div>
      <div className="admin-paint-grid" style={{ "--admin-columns": world.width } as CSSProperties}>
        {cells.map(({ x, y }) => {
          const key = `${x},${y}`;
          const robot = world.robot.x === x && world.robot.y === y;
          const goal = world.goal.x === x && world.goal.y === y;
          return <button type="button" key={key} className={blocked.has(key) ? "is-blocked" : robot ? "is-robot" : goal ? "is-goal" : ""} aria-label={`${x}, ${y}${robot ? " robot" : goal ? " goal" : blocked.has(key) ? " obstacle" : " open"}`} onClick={() => paint(x, y)}>{robot ? "▲" : goal ? "★" : blocked.has(key) ? "×" : ""}</button>;
        })}
      </div>
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
  const updateLayout = (index: number, world: GridWorldDefinition) => onUpdate({ layouts: challenge.layouts.map((layout, current) => current === index ? { ...layout, world } : layout) });
  const addLayout = () => {
    const used = new Set(challenge.layouts.map((layout) => layout.slug));
    let number = challenge.layouts.length + 1;
    while (used.has(`layout-${number}`)) number += 1;
    onUpdate({ layouts: [...challenge.layouts, { slug: `layout-${number}`, order: challenge.layouts.length + 1, world: structuredClone(challenge.world) }] });
  };
  return <div className="challenge-mechanics-editor">
    <h3>Grid and layouts</h3>
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
