import type { CSSProperties } from "react";
import type { GridWorldDefinition } from "@kodergarden/engine";
import type { PlaybackState } from "./playback.js";
import { useI18n } from "./i18n.js";

const rotation = { north: 0, east: 90, south: 180, west: 270 } as const;
const key = (x: number, y: number): string => `${x},${y}`;

export function GridWorld({ world, playback, hideStatus = false }: { readonly world: GridWorldDefinition; readonly playback: PlaybackState; readonly hideStatus?: boolean }) {
  const {t}=useI18n();
  const blocked = new Set(world.blocked.map((cell) => key(cell.x, cell.y)));
  const cells = Array.from({ length: world.width * world.height }, (_, index) => ({ x: index % world.width, y: Math.floor(index / world.width) }));
  const gridStyle = { "--columns": world.width, "--rows": world.height } as CSSProperties;
  const robotStyle = {
    "--robot-x": playback.snapshot.robot.x,
    "--robot-y": playback.snapshot.robot.y,
    "--robot-turn": `${rotation[playback.snapshot.robot.direction]}deg`,
  } as CSSProperties;

  return (
    <div className={`world-frame ${playback.status === "success" ? "is-success" : ""}`}>
      <div className="world-toolbar">
        <span><i className="live-light" /> {t("sim.live")}</span>
        <span>{world.width} × {world.height}</span>
      </div>
      <div className="grid-wrap">
        <div className="grid" style={gridStyle} role="img" aria-label="Robot simulation grid">
          {cells.map(({ x, y }) => {
            const isBlocked = blocked.has(key(x, y));
            const isGoal = world.goal.x === x && world.goal.y === y;
            return (
              <div key={key(x, y)} className={`grid-cell ${isBlocked ? "grid-cell--blocked" : ""}`}>
                {isBlocked && <span className="wall" aria-label="wall"><i /><i /><i /></span>}
                {isGoal && <span className={`battery ${playback.snapshot.completed ? "is-charged" : ""}`} aria-label="battery"><i /></span>}
                {!isBlocked && !isGoal && (x + y) % 3 === 0 && <span className="sprout" aria-hidden="true">✦</span>}
              </div>
            );
          })}
          <div className={`robot-position ${playback.collision ? "is-bumping" : ""}`} style={robotStyle}>
            <div className="robot-shadow" />
            <div className="robot">
              <div className="robot-antenna"><i /></div>
              <div className="robot-face"><i /><i /></div>
              <div className="robot-arrow">▲</div>
            </div>
          </div>
          {playback.status === "success" && <div className="celebration" aria-hidden="true"><i>✦</i><i>●</i><i>✦</i><i>●</i><i>✦</i></div>}
        </div>
      </div>
      {!hideStatus&&<div className={`world-status world-status--${playback.status}`} aria-live="polite">
        <span className="status-face">{playback.status === "success" ? "✓" : playback.collision ? "!" : playback.status === "running" ? "▶" : "•"}</span>
        <div><strong>{playback.conditionResult ? t(playback.conditionResult.condition.type==="goalReached"?(playback.conditionResult.result?"sim.goalConditionYes":"sim.goalConditionNo"):playback.conditionResult.result?`sim.condition.${playback.conditionResult.condition.direction}.yes`:`sim.condition.${playback.conditionResult.condition.direction}.no`) : playback.status==="ready"?t("sim.ready"):playback.status==="running"?(playback.collision?t("sim.blocked"):t("sim.running")):playback.status==="success"?t("sim.success"):playback.status==="limit"?t("sim.limit"):t("sim.incomplete")}</strong><small>{playback.executionSteps} {t("common.steps")}</small></div>
      </div>}
    </div>
  );
}
