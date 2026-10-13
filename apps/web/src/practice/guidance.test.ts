import { automaticGuidanceKey, emptyGuidanceProgress, guidanceOutcome, markGuidanceSeen, parseGuidanceProgress, recordHintLevel, unlockGuidanceTool } from "./guidance.js";
import { practiceChallenges } from "@kodergarden/shared";

const equal = (actual: unknown, expected: unknown, message: string): void => { if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`); };
const deepEqual = (actual: unknown, expected: unknown, message: string): void => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message); };

const first = practiceChallenges.find((challenge) => challenge.id === "sequence-01")!;
const turn = practiceChallenges.find((challenge) => challenge.id === "turn-01")!;
const repeat = practiceChallenges.find((challenge) => challenge.id === "repeat-01")!;
const family = practiceChallenges.find((challenge) => challenge.id === "condition-repeat")!;

equal(automaticGuidanceKey(first), "orientation", "first challenge opens orientation");
equal(unlockGuidanceTool(turn), "turn", "turn unlock maps to turn help");
equal(unlockGuidanceTool(repeat), "repeat", "repeat unlock maps to repeat help");
equal(automaticGuidanceKey(family), "coach:while", "family challenge introduces while help");

const seen = markGuidanceSeen(emptyGuidanceProgress(), "coach:repeat");
deepEqual(markGuidanceSeen(seen, "coach:repeat"), seen, "seen keys remain unique");
equal(recordHintLevel(recordHintLevel(seen, "sequence-01:destination", 2), "sequence-01:destination", 1).hints["sequence-01:destination"], 2, "hint progress never moves backward");
equal(parseGuidanceProgress({ version: 1, seen: ["ok", 4, "ok"], hints: { task: 4, bad: 9 } }).seen.length, 1, "stored state is bounded and sanitized");
equal(guidanceOutcome({goal:false,allItemsCollected:true,validCollections:true,passed:0,total:1,withinBlockLimit:true,requiredToolsUsed:true,collisionFree:true,safetyStop:false}), "destination", "missing destination has a focused hint");
equal(guidanceOutcome({goal:true,allItemsCollected:true,validCollections:true,passed:1,total:1,withinBlockLimit:false,requiredToolsUsed:true,collisionFree:true,safetyStop:false}), "efficiency", "working route gets efficiency help");
equal(guidanceOutcome({goal:true,allItemsCollected:true,validCollections:true,passed:1,total:1,withinBlockLimit:true,requiredToolsUsed:true,collisionFree:true,safetyStop:true}), "limit", "safety stop has priority");

console.log("practice guidance: 10 tests passed");
