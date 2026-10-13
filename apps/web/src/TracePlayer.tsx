import { useCallback, useEffect, useRef, useState } from "react";
import type { ExecutionResult, GridSnapshot } from "@kodergarden/engine";
import { semanticFrames, type PlaybackState } from "./playback.js";
import { useI18n } from "./i18n.js";

/** Playback owns an immutable, already bounded trace; pausing never suspends the interpreter. */
export function useTracePlayer(display: (state: PlaybackState) => void) {
  const [view, setView] = useState({ cursor: 0, total: 0, paused: false });
  const current = useRef<{ frames: readonly PlaybackState[]; cursor: number; paused: boolean; speed: number; finish: ((complete: boolean) => void) | null } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = useCallback(() => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; }, []);
  const show = useCallback(() => {
    const trace = current.current; if (!trace) return;
    display(trace.frames[trace.cursor]!);
    setView({ cursor: trace.cursor, total: trace.frames.length - 1, paused: trace.paused });
    if (trace.cursor === trace.frames.length - 1) { trace.finish?.(true); trace.finish = null; }
  }, [display]);
  const tick = useCallback(function advance() {
    clear(); const trace = current.current;
    if (!trace || trace.paused || trace.cursor >= trace.frames.length - 1) return;
    timer.current = setTimeout(() => { trace.cursor += 1; show(); advance(); }, 520 / trace.speed);
  }, [clear, show]);
  const cancel = useCallback(() => { clear(); current.current?.finish?.(false); current.current = null; setView({ cursor: 0, total: 0, paused: false }); }, [clear]);
  useEffect(() => () => { clear(); current.current?.finish?.(false); current.current = null; }, [clear]);
  const play = (result: ExecutionResult<GridSnapshot>, initial: GridSnapshot, speed = 1): Promise<boolean> => {
    cancel();
    return new Promise(resolve => {
      current.current = { frames: semanticFrames(initial, result.events), cursor: 0, paused: false, speed, finish: resolve };
      show(); tick();
    });
  };
  const pause = () => { const trace = current.current; if (!trace) return; trace.paused = !trace.paused; show(); if (trace.paused) clear(); else tick(); };
  const seek = (cursor: number) => { const trace = current.current; if (!trace) return; clear(); trace.paused = true; trace.cursor = Math.min(trace.frames.length - 1, Math.max(0, cursor)); show(); };
  const reviewIssue = () => {
    const trace = current.current; if (!trace) return;
    const explicitIssue = trace.frames.findIndex(frame => frame.collision !== null || frame.collectionError);
    const limit = trace.frames.findIndex(frame => frame.status === "limit");
    const target = explicitIssue >= 0 ? explicitIssue : limit >= 0 ? limit : Math.max(0, trace.frames.length - 2);
    seek(target);
  };
  return { ...view, play, cancel, pause, seek, reviewIssue, back: () => seek(view.cursor - 1), step: () => seek(view.cursor + 1), replay: () => { seek(0); const trace = current.current; if (trace) { trace.paused = false; show(); tick(); } } };
}
export function TraceControls({ player, playback }: { player: ReturnType<typeof useTracePlayer>; playback: PlaybackState }) {
  const { t } = useI18n();
  if (!player.total) return null;
  return <div className="trace-controls" aria-label={t("trace.controls")}>
    <button onClick={player.back} disabled={player.cursor === 0}>{t("trace.back")}</button>
    <button onClick={player.pause} disabled={player.cursor === player.total}>{t(player.paused ? "trace.resume" : "trace.pause")}</button>
    <button onClick={player.step} disabled={player.cursor === player.total}>{t("trace.step")}</button>
    <button onClick={player.replay}>{t("trace.replay")}</button>
    <label>{t("trace.position")}<input aria-label={t("trace.position")} type="range" min={0} max={player.total} value={player.cursor} onChange={event=>player.seek(Number(event.target.value))}/></label>
    <output aria-live="polite">{player.cursor} / {player.total}{playback.loops.map(loop=>` · ${t("trace.loop")} ${loop.path.map(part=>typeof part==="number"?part+1:t(`editor.${part}`)).join(".")}: ${t("trace.iteration")} ${loop.iteration}`).join("")}</output>
  </div>;
}
