import type { GridSnapshot } from "@kodergarden/engine";
import { applyExecutionEvent, initialPlaybackState, playbackDelay, semanticFrames } from "./playback.js";

const snapshot: GridSnapshot = { robot: { x: 0, y: 0, direction: "east" }, goal: { x: 2, y: 0 }, items:[],collectedItems:0,totalItems:0,invalidCollections:0,destinationReached:false,completed: false };
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
const packetSnapshot = { ...moved, items: [{ id: "packet", position: { x: 1, y: 0 } }], totalItems: 1 };
state = applyExecutionEvent(state, { type: "runtimeEffect", path: [3], effect: { type: "collected", objectId: "packet", position: { x: 1, y: 0 } }, state: { ...packetSnapshot, items: [], collectedItems: 1, completed: false } });
assert(state.snapshot.collectedItems === 1 && !state.collectionError && state.message.includes("collected"), "shows a successful packet collection");
state = applyExecutionEvent(state, { type: "runtimeEffect", path: [4], effect: { type: "collectFailed", reason: "no-item" }, state: { ...state.snapshot, invalidCollections: 1 } });
assert(state.collectionError && state.snapshot.invalidCollections === 1, "shows an empty collection attempt");

console.log("web playback: 7 tests passed");

// Semantic frames preserve decisions through the selected branch and can be replayed exactly.
const branchEvents = [
  {type:"programStarted" as const,state:snapshot},
  {type:"statementStarted" as const,path:[0],statementType:"ifElse" as const},
  {type:"conditionEvaluated" as const,path:[0],condition:{type:"path" as const,direction:"ahead" as const},result:false},
  {type:"statementStarted" as const,path:[0,"else",0] as const,statementType:"moveForward" as const},
  {type:"runtimeEffect" as const,path:[0,"else",0] as const,effect:{type:"moved" as const,from:{x:0,y:0},to:{x:1,y:0}},state:moved},
  {type:"statementCompleted" as const,path:[0,"else",0] as const},
  {type:"statementCompleted" as const,path:[0]},
  {type:"programFailed" as const,state:moved,executionSteps:1},
];
const frames=semanticFrames(snapshot,branchEvents);
assert(frames.length===4,"semantic stepping omits bookkeeping events");
assert(frames[2]?.conditionResult?.result===false&&JSON.stringify(frames[2].activePath)==='[0,"else",0]',"Else retains its condition during child execution");
assert(frames[1]?.snapshot.robot.x===0&&frames[2]?.snapshot.robot.x===1,"backward steps restore exact prior snapshots");
assert(JSON.stringify(frames)===JSON.stringify(semanticFrames(snapshot,branchEvents)),"trace replay is deterministic");
console.log("semantic playback regression checks passed");
