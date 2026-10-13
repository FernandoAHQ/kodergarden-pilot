import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { GridWorldDefinition } from "@kodergarden/engine";
import type { PlaybackState } from "./playback.js";
import { useI18n } from "./i18n.js";

const rotation = { north: 0, east: 90, south: 180, west: 270 } as const;

type HedgeDirection = "up" | "right" | "down" | "left";

const hedgeMovementCue = (
  from: { x: number; y: number },
  to: { x: number; y: number },
): { direction: HedgeDirection; arrow: string } | null => {
  if (to.x > from.x) return { direction: "right", arrow: "→" };
  if (to.x < from.x) return { direction: "left", arrow: "←" };
  if (to.y > from.y) return { direction: "down", arrow: "↓" };
  if (to.y < from.y) return { direction: "up", arrow: "↑" };
  return null;
};

const key = (x: number, y: number): string => `${x},${y}`;

export function GridWorld({ world, playback, hideStatus = false }: { readonly world: GridWorldDefinition; readonly playback: PlaybackState; readonly hideStatus?: boolean }) {
  const {t}=useI18n();
  const blocked = new Set(world.blocked.map((cell) => key(cell.x, cell.y)));
  const cells = Array.from({ length: world.width * world.height }, (_, index) => ({ x: index % world.width, y: Math.floor(index / world.width) }));
  const gridRatio = world.width / world.height;
  const stageRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fitGrid = (): void => {
      const availableWidth = stage.clientWidth;
      const availableHeight = stage.clientHeight;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      const nextWidth = Math.max(1, Math.floor(Math.min(650, availableWidth, availableHeight * gridRatio)));
      setGridWidth((current) => current === nextWidth ? current : nextWidth);
    };
    fitGrid();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fitGrid);
    observer?.observe(stage);
    window.addEventListener("resize", fitGrid);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", fitGrid);
    };
  }, [gridRatio]);
  const gridStyle = {
    "--columns": world.width,
    "--rows": world.height,
    ...(gridWidth === null ? {} : { width: `${gridWidth}px` }),
  } as CSSProperties;
  const robotStyle = {
    "--robot-x": playback.snapshot.robot.x,
    "--robot-y": playback.snapshot.robot.y,
    "--robot-turn": `${rotation[playback.snapshot.robot.direction]}deg`,
  } as CSSProperties;
  const shiftingHedges = playback.snapshot.shiftingHedges ?? [];
  const items = playback.snapshot.items ?? [];
  const hasItemObjective = world.items !== undefined;
  const authoredShiftingHedges = new Map(
    (world.shiftingHedges ?? []).map((hedge) => [hedge.id, hedge]),
  );

  return (
    <div className={`world-frame ${playback.status === "success" ? "is-success" : ""}`}>
      <div className="grid-wrap">
        <div className="grid-stage" ref={stageRef}>
         <div className="grid" style={gridStyle} role="img" aria-label="Robot simulation grid">
          {cells.map(({ x, y }) => {
            const isBlocked = blocked.has(key(x, y));
            const isGoal = world.goal.x === x && world.goal.y === y;
            return (
              <div key={key(x, y)} className={`grid-cell ${isBlocked ? "grid-cell--blocked" : ""}`}>
                {isBlocked && <span className="wall" aria-label="wall"><i /><i /><i /></span>}
                {isGoal && <span className={`battery ${playback.snapshot.destinationReached ? "is-charged" : ""}`} aria-label="battery"><i /></span>}
                {!isBlocked && !isGoal && (x + y) % 3 === 0 && <span className="sprout" aria-hidden="true">✦</span>}
              </div>
            );
          })}
          {items.map(item=><div key={item.id} className="seed-packet-position" style={{"--item-x":item.position.x,"--item-y":item.position.y} as CSSProperties} aria-label={t("sim.seedPacket")}><span className="seed-packet">✦</span></div>)}
          {shiftingHedges.map((hedge) => {
            const authoredHedge = authoredShiftingHedges.get(hedge.id);
            const isWaitingToMove = authoredHedge
              && hedge.position.x === authoredHedge.from.x
              && hedge.position.y === authoredHedge.from.y;
            const movementCue = isWaitingToMove
              ? hedgeMovementCue(authoredHedge.from, authoredHedge.to)
              : null;

            return <div
              key={hedge.id}
              className="shifting-hedge"
              aria-label="shifting hedge"
              style={{ "--hedge-x": hedge.position.x, "--hedge-y": hedge.position.y } as CSSProperties}
            >
              <span className="wall"><i /><i /><i /></span>
              {movementCue && <b
                className="hedge-direction"
                data-direction={movementCue.direction}
                aria-hidden="true"
              >{movementCue.arrow}</b>}
            </div>;
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
      </div>
      {hasItemObjective&&<div className="objective-status" aria-label={t("sim.objectives")}>
        <span className={playback.snapshot.destinationReached?"is-complete":""}>{playback.snapshot.destinationReached?"✓":"○"} {t("sim.destinationObjective")}</span>
        <span className={playback.snapshot.collectedItems===playback.snapshot.totalItems?"is-complete":""}>{playback.snapshot.collectedItems===playback.snapshot.totalItems?"✓":"○"} {t("sim.packetObjective",{collected:playback.snapshot.collectedItems,total:playback.snapshot.totalItems})}</span>
        {playback.snapshot.invalidCollections>0&&<span className="is-error">! {t("sim.invalidCollections",{count:playback.snapshot.invalidCollections})}</span>}
      </div>}
      {!hideStatus&&<div className={`world-status world-status--${playback.status}`} aria-live="polite">
        <span className="status-face">{playback.status === "success" ? "✓" : playback.collision||playback.collectionError ? "!" : playback.status === "running" ? "▶" : "•"}</span>
        <div><strong>{playback.status==="limit"?t("sim.limit"):playback.conditionResult ? t(playback.conditionResult.condition.type==="goalReached"?(playback.conditionResult.result?"sim.goalConditionYes":"sim.goalConditionNo"):playback.conditionResult.condition.type==="itemHere"?(playback.conditionResult.result?"sim.itemConditionYes":"sim.itemConditionNo"):playback.conditionResult.result?`sim.condition.${playback.conditionResult.condition.direction}.yes`:`sim.condition.${playback.conditionResult.condition.direction}.no`) : playback.status==="ready"?t("sim.ready"):playback.status==="running"?(playback.collision?t("sim.blocked"):playback.collectionError?t("sim.collectEmpty"):t("sim.running")):playback.status==="success"?t("sim.success"):t("sim.incomplete")}</strong><small>{playback.executionSteps} {t("common.steps")}</small></div>
      </div>}
    </div>
  );
}
