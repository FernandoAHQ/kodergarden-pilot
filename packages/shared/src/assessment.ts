import { executeProgram, GridRuntime, type Direction, type GridWorldDefinition } from "@kodergarden/engine";
import type { Program } from "@kodergarden/language";
import { evaluateChallengeProgram, evaluationScope, type AssessmentPolicy, type EvaluationScope, type PracticeChallengeDefinition } from "./practice.js";

export type Observation = "missing" | "supported" | "independent" | "transferred";
export interface LearnerEvidence {
  readonly predictionTiming?: "before-run" | "after-run";
  readonly prediction?: { readonly x: number; readonly y: number; readonly direction: Direction };
  readonly explanation?: string;
  readonly assistance: "not-stated" | "none" | "conceptual" | "interface";
  readonly replayed: boolean;
  /** Product-observed guidance use. Kept separate from the learner's self-report. */
  readonly observedAssistance?: "interface" | "conceptual";
  readonly guidanceVersion?: number;
  readonly hintLevel?: number;
}
export interface AssessmentEvidence {
  readonly kind: PracticeChallengeDefinition["type"];
  readonly scope: EvaluationScope;
  readonly occasion: AssessmentPolicy["occasion"];
  readonly correctness: boolean;
  readonly cases: readonly {readonly id:string; readonly correct:boolean; readonly destinationReached:boolean; readonly allItemsCollected:boolean; readonly itemsCollected:number; readonly itemsTotal:number; readonly invalidCollections:number; readonly safetyStop:boolean; readonly executionSteps:number; readonly collisions:number}[];
  readonly predictionTiming: "before-run" | "after-run" | "unknown";
  readonly prediction: "missing" | "correct" | "incorrect" | null;
  readonly repair: "missing" | "changed" | null;
  readonly explanationProvided: boolean;
  readonly assistance: LearnerEvidence["assistance"];
  readonly observedAssistance?: LearnerEvidence["observedAssistance"];
  readonly guidanceVersion?: number;
  readonly hintLevel?: number;
  readonly replayed: boolean;
  /** Teacher observation only. Automated results never promote this field. */
  readonly observation: Observation;
}
export function validAssessmentPolicy(value: unknown): value is AssessmentPolicy {
  if (!value || typeof value !== "object") return false;
  const v = value as AssessmentPolicy;
  return ["active-case","case-family"].includes(v.scope) && ["legacy","discovery"].includes(v.correctness)
    && (v.maxCollisions === null || Number.isSafeInteger(v.maxCollisions) && v.maxCollisions >= 0 && v.maxCollisions <= 1000)
    && ["initial","fresh","delayed"].includes(v.occasion);
}
export function parseLearnerEvidence(value: unknown): LearnerEvidence | null {
  if (value === undefined || value === null) return { assistance: "not-stated", replayed: false };
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as LearnerEvidence;
  if (!["not-stated","none","conceptual","interface"].includes(v.assistance) || typeof v.replayed !== "boolean") return null;
  if (v.explanation !== undefined && (typeof v.explanation !== "string" || v.explanation.length > 500)) return null;
  if (v.predictionTiming !== undefined && !["before-run","after-run"].includes(v.predictionTiming)) return null;
  if (v.observedAssistance !== undefined && !["interface","conceptual"].includes(v.observedAssistance)) return null;
  if (v.guidanceVersion !== undefined && (!Number.isSafeInteger(v.guidanceVersion) || v.guidanceVersion < 1 || v.guidanceVersion > 1000)) return null;
  if (v.hintLevel !== undefined && (!Number.isSafeInteger(v.hintLevel) || v.hintLevel < 1 || v.hintLevel > 4)) return null;
  const p = v.prediction;
  if (p !== undefined && (!p || !Number.isSafeInteger(p.x) || !Number.isSafeInteger(p.y) || p.x < 0 || p.y < 0 || p.x > 99 || p.y > 99 || !["north","east","south","west"].includes(p.direction))) return null;
  return { assistance: v.assistance, replayed: v.replayed, ...(v.predictionTiming ? {predictionTiming:v.predictionTiming} : {}), ...(p ? { prediction: { x:p.x,y:p.y,direction:p.direction } } : {}), ...(v.explanation === undefined ? {} : { explanation:v.explanation.trim() }), ...(v.observedAssistance ? { observedAssistance:v.observedAssistance } : {}), ...(v.guidanceVersion ? { guidanceVersion:v.guidanceVersion } : {}), ...(v.hintLevel ? { hintLevel:v.hintLevel } : {}) };
}
export function assessAttempt(challenge: PracticeChallengeDefinition, candidate: Program, input: LearnerEvidence, world: GridWorldDefinition = challenge.world) {
  const evaluation = evaluateChallengeProgram(challenge, candidate, world);
  let prediction: AssessmentEvidence["prediction"] = null;
  if (challenge.type === "predict") {
    const expected = executeProgram(challenge.starter, new GridRuntime(world));
    const p = input.prediction, actual = expected.finalState.robot;
    prediction = !p ? "missing" : !expected.stoppedByLimit && p.x === actual.x && p.y === actual.y && p.direction === actual.direction ? "correct" : "incorrect";
  }
  const changed = JSON.stringify(candidate.statements) !== JSON.stringify(challenge.starter.statements);
  const explanationProvided = !!input.explanation?.trim();
  const complete = challenge.type === "predict" ? prediction === "correct" : evaluation.complete && (challenge.type !== "debug" || changed && explanationProvided);
  const evidence: AssessmentEvidence = { kind:challenge.type,scope:evaluationScope(challenge),occasion:challenge.assessment?.occasion ?? "initial",correctness:challenge.type === "predict" ? prediction === "correct" : evaluation.complete,
    cases:evaluation.layouts.map(layout=>({id:layout.id,correct:layout.succeeded && layout.invalidCollections===0 && layout.collisions <= (challenge.assessment?.maxCollisions ?? challenge.maxCollisions ?? (challenge.campaignId === "foundations" ? 0 : Infinity)),destinationReached:layout.goalReached,allItemsCollected:layout.allItemsCollected,itemsCollected:layout.itemsCollected,itemsTotal:layout.itemsTotal,invalidCollections:layout.invalidCollections,safetyStop:layout.stoppedByLimit,executionSteps:layout.executionSteps,collisions:layout.collisions})),
    prediction,predictionTiming:input.predictionTiming??"unknown",repair:challenge.type === "debug" ? changed ? "changed" : "missing" : null,explanationProvided,assistance:input.assistance,...(input.observedAssistance ? { observedAssistance:input.observedAssistance } : {}),...(input.guidanceVersion ? { guidanceVersion:input.guidanceVersion } : {}),...(input.hintLevel ? { hintLevel:input.hintLevel } : {}),replayed:input.replayed,observation:"missing" };
  return { ...evaluation, complete, evidence };
}
