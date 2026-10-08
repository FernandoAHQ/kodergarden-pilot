import type { GridSnapshot } from "@kodergarden/engine";
import { applyExecutionEvent, initialPlaybackState, playbackDelay } from "./playback.js";

const snapshot: GridSnapshot = { robot: { x: 0, y: 0, direction: "east" }, goal: { x: 2, y: 0 }, completed: false };
const moved: GridSnapshot = { ...snapshot, robot: { x: 1, y: 0, direction: "east" } };
const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };

let state = initialPlaybackState(snapshot);
state = applyExecutionEvent(state, { type: "programStarted", state: snapshot });
const shifted={...snapshot,shiftingHedges:[{id:"gate",position:{x:1,y:0}}]};
state = applyExecutionEvent(state, { type:"runtimeEffect",path:[],effect:{type:"worldChanged",objectId:"gate",from:{x:0,y:0},to:{x:1,y:0},cause:"before-run"},state:shifted });
assert(state.executionSteps===0&&state.snapshot===shifted,"world changes animate without counting as learner commands");
state = applyExecutionEvent(state, { type: "statementStarted", path: [0], statementType: "moveForward" });
assert(state.status === "running" && state.activePath?.[0] === 0, "starts and highlights a statement");
state = applyExecutionEvent(state, { type: "runtimeEffect", path: [0], effect: { type: "moved", from: { x: 0, y: 0 }, to: { x: 1, y: 0 } }, state: moved });
assert(state.snapshot.robot.x === 1 && state.executionSteps === 1, "applies runtime snapshots without simulation logic");
state = applyExecutionEvent(state, { type: "runtimeEffect", path: [1], effect: { type: "blocked", reason: "obstacle" }, state: moved });
assert(state.collision === "obstacle" && state.executionSteps === 2, "exposes collision feedback");
state = applyExecutionEvent(state, { type: "conditionEvaluated", path: [2], condition: { type: "path", direction: "left" }, result: false });
assert(state.conditionResult?.result === false && state.message.includes("NO"), "exposes condition evaluation feedback");
assert(playbackDelay({ type: "programStarted", state: snapshot }, 2) < playbackDelay({ type: "programStarted", state: snapshot }, 1), "speed only changes playback timing");
assert(playbackDelay({ type:"runtimeEffect",path:[],effect:{type:"worldChanged",objectId:"gate",from:{x:0,y:0},to:{x:1,y:0},cause:"before-run"},state:shifted },1)>playbackDelay({type:"runtimeEffect",path:[0],effect:{type:"moved",from:{x:0,y:0},to:{x:1,y:0}},state:moved},1),"hedge movement gets a visible animation pause");

console.log("web playback: 5 tests passed");
