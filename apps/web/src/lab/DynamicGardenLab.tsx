import { useMemo, useState, type CSSProperties } from "react";

type Direction = "north" | "east" | "south" | "west";
type Position = { readonly x: number; readonly y: number };
type Mechanic = "shifting" | "triggered" | "pushable";
type Cause = "before-run" | "pressure-tile" | "pushed-by-pip";

interface LabDefinition {
  readonly id: Mechanic;
  readonly title: string;
  readonly description: string;
  readonly width: number;
  readonly height: number;
  readonly robot: Position & { readonly direction: Direction };
  readonly goal: Position;
  readonly fixed: readonly Position[];
  readonly obstacle: { readonly id: string; readonly kind: "hedge" | "planter"; readonly from: Position; readonly to: Position; readonly cause: Cause };
  readonly trigger?: Position;
}

interface LabSnapshot {
  readonly robot: Position & { readonly direction: Direction };
  readonly obstacle: Position;
  readonly shifted: boolean;
  readonly completed: boolean;
}

type LabEvent =
  | { readonly type: "condition"; readonly result: boolean; readonly snapshot: LabSnapshot }
  | { readonly type: "moved" | "turned"; readonly snapshot: LabSnapshot }
  | { readonly type: "worldChanged"; readonly objectId: string; readonly from: Position; readonly to: Position; readonly cause: Cause; readonly snapshot: LabSnapshot }
  | { readonly type: "completed" | "stopped"; readonly snapshot: LabSnapshot };

const key = ({ x, y }: Position): string => `${x},${y}`;
const directions: readonly Direction[] = ["north", "east", "south", "west"];
const delta: Record<Direction, Position> = { north: { x: 0, y: -1 }, east: { x: 1, y: 0 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 } };
const allCells = (width: number, height: number): Position[] => Array.from({ length: width * height }, (_, index) => ({ x: index % width, y: Math.floor(index / width) }));
const corridor = (width: number, height: number, open: readonly Position[], exclusions: readonly Position[] = []): Position[] => {
  const passable = new Set([...open, ...exclusions].map(key));
  return allCells(width, height).filter((cell) => !passable.has(key(cell)));
};

export const dynamicLabDefinitions: readonly LabDefinition[] = [
  {
    id: "shifting", title: "A · Shifting hedge", description: "The marked hedge slides before Run, then stays still.", width: 5, height: 6,
    robot: { x: 0, y: 4, direction: "east" }, goal: { x: 1, y: 1 },
    fixed: corridor(5, 6, [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 }], [{ x: 2, y: 3 }, { x: 2, y: 4 }]),
    obstacle: { id: "shifting-hedge", kind: "hedge", from: { x: 2, y: 3 }, to: { x: 2, y: 4 }, cause: "before-run" },
  },
  {
    id: "triggered", title: "B · Triggered sliding gate", description: "A flower tile moves the gate before Pip's next instruction.", width: 6, height: 6,
    robot: { x: 0, y: 4, direction: "east" }, goal: { x: 2, y: 1 }, trigger: { x: 2, y: 4 },
    fixed: corridor(6, 6, [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 }], [{ x: 3, y: 3 }, { x: 3, y: 4 }]),
    obstacle: { id: "sliding-gate", kind: "hedge", from: { x: 3, y: 3 }, to: { x: 3, y: 4 }, cause: "pressure-tile" },
  },
  {
    id: "pushable", title: "C · Pushable planter", description: "Move pushes the planter once; the hedge behind it prevents a second push.", width: 5, height: 5,
    robot: { x: 1, y: 3, direction: "east" }, goal: { x: 2, y: 1 },
    fixed: corridor(5, 5, [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 }]),
    obstacle: { id: "planter", kind: "planter", from: { x: 2, y: 3 }, to: { x: 3, y: 3 }, cause: "pushed-by-pip" },
  },
];

const snapshot = (robot: LabSnapshot["robot"], obstacle: Position, shifted: boolean, goal: Position): LabSnapshot => ({ robot: { ...robot }, obstacle: { ...obstacle }, shifted, completed: key(robot) === key(goal) });

export function simulateDynamicGarden(definition: LabDefinition): readonly LabEvent[] {
  let robot = { ...definition.robot };
  let obstacle = { ...definition.obstacle.from };
  let shifted = false;
  const events: LabEvent[] = [];
  const fixed = new Set(definition.fixed.map(key));
  const state = () => snapshot(robot, obstacle, shifted, definition.goal);
  const inside = (position: Position) => position.x >= 0 && position.y >= 0 && position.x < definition.width && position.y < definition.height;
  const cellAhead = (origin: Position = robot, direction: Direction = robot.direction): Position => ({ x: origin.x + delta[direction].x, y: origin.y + delta[direction].y });
  const canPush = (): boolean => {
    const ahead = cellAhead();
    if (key(ahead) !== key(obstacle) || definition.obstacle.kind !== "planter") return false;
    const beyond = cellAhead(obstacle, robot.direction);
    return inside(beyond) && !fixed.has(key(beyond)) && key(beyond) !== key(definition.goal);
  };
  const openAhead = (): boolean => {
    const ahead = cellAhead();
    if (!inside(ahead) || fixed.has(key(ahead))) return false;
    return key(ahead) !== key(obstacle) || canPush();
  };

  if (definition.id === "shifting") {
    const from = obstacle; obstacle = { ...definition.obstacle.to }; shifted = true;
    events.push({ type: "worldChanged", objectId: definition.obstacle.id, from, to: obstacle, cause: "before-run", snapshot: state() });
  }

  for (let iteration = 0; iteration < 40 && !state().completed; iteration += 1) {
    const open = openAhead();
    events.push({ type: "condition", result: open, snapshot: state() });
    if (open) {
      const ahead = cellAhead();
      if (key(ahead) === key(obstacle) && canPush()) {
        const from = obstacle; obstacle = cellAhead(obstacle, robot.direction); shifted = true;
        events.push({ type: "worldChanged", objectId: definition.obstacle.id, from, to: obstacle, cause: "pushed-by-pip", snapshot: state() });
      }
      robot = { ...ahead, direction: robot.direction };
      events.push({ type: "moved", snapshot: state() });
      if (definition.trigger && !shifted && key(robot) === key(definition.trigger)) {
        const from = obstacle; obstacle = { ...definition.obstacle.to }; shifted = true;
        events.push({ type: "worldChanged", objectId: definition.obstacle.id, from, to: obstacle, cause: "pressure-tile", snapshot: state() });
      }
    } else {
      const index = (directions.indexOf(robot.direction) + directions.length - 1) % directions.length;
      robot = { ...robot, direction: directions[index]! };
      events.push({ type: "turned", snapshot: state() });
    }
  }
  events.push({ type: state().completed ? "completed" : "stopped", snapshot: state() });
  return events;
}

const labels: Record<LabEvent["type"], string> = { condition: "Checked path ahead", moved: "Pip moved", turned: "Pip turned left", worldChanged: "Garden changed", completed: "Battery reached", stopped: "Safety limit reached" };
const scoreWeights = { predictability: .4, relevance: .25, clarity: .15, consistency: .1, simplicity: .1 } as const;
type ScoreKey = keyof typeof scoreWeights;
const scoreLabels: Record<ScoreKey, string> = { predictability: "Predictable after one demo", relevance: "Makes the blocks necessary", clarity: "Clear cause and effect", consistency: "Matches existing rules", simplicity: "Simple to build and author" };

export function DynamicGardenLab() {
  const [mechanic, setMechanic] = useState<Mechanic>("shifting");
  const definition = dynamicLabDefinitions.find((item) => item.id === mechanic)!;
  const events = useMemo(() => simulateDynamicGarden(definition), [definition]);
  const [eventIndex, setEventIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [scores, setScores] = useState<Record<Mechanic, Record<ScoreKey, number>>>(() => Object.fromEntries(dynamicLabDefinitions.map((item) => [item.id, { predictability: 3, relevance: 3, clarity: 3, consistency: 3, simplicity: 3 }])) as Record<Mechanic, Record<ScoreKey, number>>);
  const initial = snapshot(definition.robot, definition.obstacle.from, false, definition.goal);
  const current = eventIndex >= 0 ? events[Math.min(eventIndex, events.length - 1)]!.snapshot : initial;
  const fixed = new Set(definition.fixed.map(key));
  const select = (next: Mechanic) => { setMechanic(next); setEventIndex(-1); setRunning(false); };
  const step = () => setEventIndex((value) => Math.min(events.length - 1, value + 1));
  const run = async () => {
    if (running) return; setRunning(true);
    for (let index = eventIndex + 1; index < events.length; index += 1) { setEventIndex(index); await new Promise((resolve) => window.setTimeout(resolve, events[index]!.type === "worldChanged" ? 700 : 380)); }
    setRunning(false);
  };
  const score = scores[mechanic];
  const weighted = (Object.keys(scoreWeights) as ScoreKey[]).reduce((total, name) => total + score[name] * scoreWeights[name], 0);
  const qualifies = score.predictability >= 4 && weighted >= 4;
  const event = eventIndex >= 0 ? events[eventIndex] : null;
  const rotation = { north: 0, east: 90, south: 180, west: 270 }[current.robot.direction];
  return <main className="dynamic-lab">
    <header><div><span>Development-only prototype</span><h1>Dynamic Garden Lab</h1><p>Shifting Hedge is selected. Compare the retained alternatives and record review evidence here.</p></div><a href="/">Exit lab</a></header>
    <nav aria-label="Prototype mechanics">{dynamicLabDefinitions.map((item) => <button key={item.id} className={item.id === mechanic ? "is-active" : ""} onClick={() => select(item.id)} disabled={running}>{item.title}</button>)}</nav>
    <section className="dynamic-lab__workspace">
      <article className="dynamic-lab__stage">
        <div className="dynamic-lab__heading"><div><h2>{definition.title}</h2><p>{definition.description}</p></div><strong>{current.completed ? "Complete" : event ? labels[event.type] : "Ready"}</strong></div>
        <div className="lab-grid" style={{ "--lab-columns": definition.width, "--lab-rows": definition.height } as CSSProperties}>
          {allCells(definition.width, definition.height).map((cell) => <div key={key(cell)} className={`lab-cell ${fixed.has(key(cell)) ? "is-fixed" : ""} ${definition.trigger && key(cell) === key(definition.trigger) ? "is-trigger" : ""}`}>{definition.trigger && key(cell) === key(definition.trigger) ? "✿" : ""}{key(cell) === key(definition.goal) ? <span className="lab-battery">▣</span> : null}</div>)}
          <div className={`lab-object is-${definition.obstacle.kind} ${event?.type === "worldChanged" ? "is-moving" : ""}`} style={{ "--lab-x": current.obstacle.x, "--lab-y": current.obstacle.y } as CSSProperties}>{definition.obstacle.kind === "planter" ? "♟" : "╫"}</div>
          <div className="lab-pip" style={{ "--lab-x": current.robot.x, "--lab-y": current.robot.y, "--lab-turn": `${rotation}deg` } as CSSProperties}>▲</div>
        </div>
        <div className="dynamic-lab__controls"><button onClick={() => { setEventIndex(-1); setRunning(false); }} disabled={running}>Reset</button><button onClick={step} disabled={running || eventIndex >= events.length - 1}>Step event</button><button className="is-primary" onClick={() => void run()} disabled={running || eventIndex >= events.length - 1}>{running ? "Running…" : "Run reference program"}</button></div>
        <pre>Repeat Until Battery {`{`} If path ahead → Move; Else → Turn Left {`}`}</pre>
        {event?.type === "worldChanged" && <p className="lab-event">{event.objectId}: ({event.from.x},{event.from.y}) → ({event.to.x},{event.to.y}) · {event.cause}</p>}
      </article>
      <aside className="dynamic-lab__score"><span>Proxy review rubric</span><h2>Score this mechanic</h2>{(Object.keys(scoreWeights) as ScoreKey[]).map((name) => <label key={name}><span>{scoreLabels[name]} <b>{Math.round(scoreWeights[name] * 100)}%</b></span><select value={score[name]} onChange={(input) => setScores((currentScores) => ({ ...currentScores, [mechanic]: { ...currentScores[mechanic], [name]: Number(input.target.value) } }))}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>)}<div className={`lab-verdict ${qualifies ? "is-qualified" : ""}`}><strong>{weighted.toFixed(2)} / 5</strong><span>{qualifies ? "Qualifies for consideration" : "Does not meet the graduation rule"}</span></div><p>Reject the mechanic if reviewers describe it mainly as a timing or pushing puzzle. In a tie, prefer Shifting Hedge.</p></aside>
    </section>
  </main>;
}
