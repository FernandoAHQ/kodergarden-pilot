import { useState } from "react";
import type { AssessmentEvidence, LearnerEvidence, PracticeChallengeDefinition } from "@kodergarden/shared";
import { evaluationScope } from "@kodergarden/shared";
import { useI18n } from "./i18n.js";

export const emptyEvidence = (): LearnerEvidence => ({assistance:"not-stated",replayed:false});
export function EvidenceForm({challenge,value,onChange,disabled=false}:{challenge:PracticeChallengeDefinition;value:LearnerEvidence;onChange:(value:LearnerEvidence)=>void;disabled?:boolean}) {
  const {t}=useI18n();
  const [draft,setDraft]=useState({x:0,y:0,direction:"north" as const as "north"|"east"|"south"|"west"});
  return <fieldset className={`evidence-form evidence-form--${challenge.type}`} disabled={disabled}>
    <legend>{t(`assessment.type.${challenge.type}`)} · {t(`assessment.scope.${evaluationScope(challenge)}`)}</legend>
    {challenge.type==="predict" && <><p>{t("assessment.predictPrompt")}</p><label>{t("assessment.column")}<input type="number" min={1} max={challenge.world.width} value={draft.x+1} onChange={e=>setDraft({...draft,x:Math.min(challenge.world.width-1,Math.max(0,Number(e.target.value)-1))})} disabled={!!value.prediction}/></label><label>{t("assessment.row")}<input type="number" min={1} max={challenge.world.height} value={draft.y+1} onChange={e=>setDraft({...draft,y:Math.min(challenge.world.height-1,Math.max(0,Number(e.target.value)-1))})} disabled={!!value.prediction}/></label><label>{t("assessment.direction")}<select value={draft.direction} onChange={e=>setDraft({...draft,direction:e.target.value as typeof draft.direction})} disabled={!!value.prediction}>{(["north","east","south","west"] as const).map(d=><option key={d} value={d}>{t(`assessment.direction.${d}`)}</option>)}</select></label><button type="button" disabled={!!value.prediction} onClick={()=>onChange({...value,prediction:draft,predictionTiming:value.replayed?"after-run":"before-run"})}>{t(value.prediction?"assessment.committed":"assessment.commit")}</button></>}
    <label>{t(challenge.type==="debug"?"assessment.debugPrompt":"assessment.explain")}<textarea maxLength={500} value={value.explanation??""} onChange={e=>onChange({...value,explanation:e.target.value})}/></label>
  </fieldset>;
}
export function EvidenceResult({evidence}:{evidence:AssessmentEvidence}) {
  const {t}=useI18n();
  return <p className="evidence-result" role="status">{t("assessment.evidence")}: {t(`assessment.observation.${evidence.observation}`)} · {t(evidence.correctness?"assessment.correct":"assessment.incorrect")}{evidence.prediction?` · ${t(`assessment.prediction.${evidence.prediction}`)} · ${t(`assessment.timing.${evidence.predictionTiming??"unknown"}`)}`:""} · {t("assessment.learnerReport")}: {t(`assessment.assistance.${evidence.assistance}`)}{evidence.observedAssistance?` · ${t("assessment.productGuidance")}: ${t(`guidance.support.${evidence.observedAssistance}`)}`:""}{evidence.kind==="debug"?` · ${t(evidence.explanationProvided?"assessment.explanationPresent":"assessment.explanationRequired")}`:""} · {evidence.cases.filter(item=>item.correct).length}/{evidence.cases.length} {t(`assessment.scope.${evidence.scope}`)} · {t("assessment.noMastery")}</p>;
}
/** Only coded, bounded attempt evidence is stored locally; no explanations or names. */
export function saveAttemptEvidence(challengeId:string,evidence:AssessmentEvidence) {
  try { const raw:unknown=JSON.parse(localStorage.getItem("kodergarden.evidence.v1")??"[]"); const previous=Array.isArray(raw)?raw:[]; localStorage.setItem("kodergarden.evidence.v1",JSON.stringify([...previous,{challengeId,at:Date.now(),evidence}].slice(-100))); } catch { /* Storage is optional. */ }
}
