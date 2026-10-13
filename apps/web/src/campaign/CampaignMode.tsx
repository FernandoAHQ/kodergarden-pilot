import { EvidenceForm, emptyEvidence, saveAttemptEvidence } from "../Assessment.js";
import { assessAttempt, type AssessmentEvidence, type LearnerEvidence } from "@kodergarden/shared";
import { TraceControls, useTracePlayer } from "../TracePlayer.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CampaignDefinition, type PracticeChallengeDefinition } from "@kodergarden/shared";
import { countBlocks, validateProgram, type Program } from "@kodergarden/language";
import { executeProgram, GridRuntime } from "@kodergarden/engine";
import { VisualEditor } from "../editor/VisualEditor.js";
import { commitHistory, createHistory, fromExecutableProgram, redoHistory, toExecutableProgram, undoHistory, type EditorProgram } from "../editor/model.js";
import { GridWorld } from "../GridWorld.js";
import { useI18n } from "../i18n.js";
import { initialPlaybackState } from "../playback.js";
import { campaignChallengeUnlocked, loadCampaignProgress, recordCampaignRun, saveCampaignProgress, starsForRun, type CampaignProgress } from "./progress.js";
import campaignIcon from "../../../../resources/assets/home/icon_challenges.webp";
import { ProgressIndicator, StudentHeader } from "../student/StudentUi.js";

let identity=0;
const makeEditor=(source:Program):EditorProgram=>fromExecutableProgram(source,()=>`campaign-${identity++}`);
const stars=(count:number)=>`${"★".repeat(count)}${"☆".repeat(3-count)}`;

export function CampaignMode({campaigns,onBack}:{readonly campaigns:readonly CampaignDefinition[];readonly onBack:()=>void}){
 const advancedCampaigns=campaigns.filter(campaign=>campaign.kind==="advanced");
 const {t}=useI18n();
 const [screen,setScreen]=useState<"library"|"path"|"challenge">("library");
 const [campaign,setCampaign]=useState<CampaignDefinition>(advancedCampaigns[0]!);
 const [challenge,setChallenge]=useState<PracticeChallengeDefinition>(advancedCampaigns[0]!.challenges[0]!);
 const [progress,setProgress]=useState<CampaignProgress>(loadCampaignProgress);
 const [history,setHistory]=useState(()=>createHistory(makeEditor(challenge.starter)));
 const [playback,setPlayback]=useState(()=>initialPlaybackState(new GridRuntime(challenge.world).snapshot())); const player = useTracePlayer(setPlayback);
 const [evidence,setEvidence]=useState<LearnerEvidence>(emptyEvidence); const [,setEvidenceResult]=useState<AssessmentEvidence|null>(null);
 const speed=1; const [workbenchView,setWorkbenchView]=useState<"program"|"world">("program");
 const [outcome,setOutcome]=useState<{complete:boolean;stars:0|1|2|3;blocks:number;steps:number}|null>(null);
 const controller=useRef<AbortController|null>(null); const editor=history.present; const executable=useMemo(()=>challenge.type==="predict"?challenge.starter:toExecutableProgram(editor),[editor,challenge]); const running=player.total>0&&player.cursor<player.total;
 const initial=useCallback(()=>new GridRuntime(challenge.world).snapshot(),[challenge]);
 const chooseCampaign=(next:CampaignDefinition)=>{setCampaign(next);setScreen("path");};
 useEffect(()=>{player.cancel();controller.current?.abort();controller.current=null;setPlayback(initialPlaybackState(initial()));setOutcome(null);setEvidenceResult(null);},[executable]);
 const choose=(next:PracticeChallengeDefinition)=>{controller.current?.abort();player.cancel();setChallenge(next);setEvidence(emptyEvidence());setEvidenceResult(null);controller.current=null;setHistory(createHistory(makeEditor(next.starter)));setPlayback(initialPlaybackState(new GridRuntime(next.world).snapshot()));setOutcome(null);setWorkbenchView("program");setScreen("challenge");requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"auto"}));};
 const edit=(next:EditorProgram)=>{player.cancel();setEvidenceResult(null);setHistory(current=>commitHistory(current,next));setOutcome(null);};
 const reset=useCallback(()=>{controller.current?.abort();player.cancel();controller.current=null;setPlayback(initialPlaybackState(initial()));setOutcome(null);},[initial]);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const run=async()=>{if(controller.current)return;setWorkbenchView("world");reset();const valid=validateProgram(executable);if(!valid.ok)return;const blocks=countBlocks(valid.program);const result=executeProgram(valid.program,new GridRuntime(challenge.world));const control=new AbortController();controller.current=control;if (!await player.play(result, new GridRuntime(challenge.world).snapshot(), speed)) return;if(control.signal.aborted)return;controller.current=null;const evaluation=assessAttempt(challenge,valid.program,evidence);setEvidenceResult(evaluation.evidence);saveAttemptEvidence(challenge.id,evaluation.evidence);setEvidence(current=>({...current,replayed:true}));const steps=Math.max(0,...evaluation.layouts.map(layout=>layout.executionSteps));const rating=challenge.type==="predict"?(evaluation.complete?1:0):starsForRun(evaluation.complete,blocks,steps,challenge.parBlocks??Infinity,challenge.parSteps??Infinity);setOutcome({complete:evaluation.complete,stars:rating,blocks,steps});if(rating>0){const earned=rating as 1|2|3;setProgress(current=>{const next=recordCampaignRun(current,campaign.id,challenge.id,blocks,steps,earned);saveCampaignProgress(next);return next;});}};
 const nextChallenge=()=>{const next=campaign.challenges[challenge.order];if(next)choose(next);else setScreen("path");};
 if(screen==="library"){return <main className="student-page student-page--campaigns"><StudentHeader section={t("campaign.mode")} backLabel={t("live.home")} onBack={onBack}/><section className="student-intro"><div><span className="eyebrow"><i/>{t("campaign.mode")}</span><h1>{t("campaign.library.title")}</h1><p>{t("campaign.library.body")}</p></div><img src={campaignIcon} alt="" aria-hidden="true" decoding="async"/></section><section className="campaign-library campaign-library--refined">{advancedCampaigns.map(item=>{const results=progress.campaigns[item.id]??{};const completed=Object.keys(results).length;const totalStars=Object.values(results).reduce((sum,result)=>sum+result.stars,0);return <button className="campaign-tile" key={item.id} onClick={()=>chooseCampaign(item)}><span className="campaign-tile__art"><img src={campaignIcon} alt="" aria-hidden="true" loading="lazy" decoding="async"/></span><span className="campaign-tile__copy"><small>{t("campaign.label")} {item.order-1}</small><strong>{t(item.titleKey)}</strong><span>{t(item.descriptionKey)}</span><ProgressIndicator value={completed} total={item.challenges.length} label={t("practice.progress",{done:completed,total:item.challenges.length})}/><b className="campaign-tile__stars">★ {totalStars} / {item.challenges.length*3}</b><em>{t("campaign.open")} →</em></span></button>})}</section></main>}
 if(screen==="path"){const ids=campaign.challenges.map(item=>item.id);const results=progress.campaigns[campaign.id]??{};const completed=Object.keys(results).length;const totalStars=Object.values(results).reduce((sum,result)=>sum+result.stars,0);return <main className="student-page student-page--path"><StudentHeader section={t("campaign.mode")} backLabel={t("campaign.all")} onBack={()=>setScreen("library")}/><section className="student-intro student-intro--compact"><div><span className="eyebrow"><i/>{t("campaign.mode")}</span><h1>{t(campaign.titleKey)}</h1><p>{t(campaign.descriptionKey)}</p><ProgressIndicator value={completed} total={campaign.challenges.length} label={t("campaign.summary",{done:completed,total:campaign.challenges.length,stars:totalStars,max:campaign.challenges.length*3})}/></div></section><section className="campaign-stage-path" aria-label={t(campaign.titleKey)}>{campaign.challenges.map(item=>{const unlocked=campaignChallengeUnlocked(item.order,ids,progress,campaign.id);const result=results[item.id];const state=result?"completed":unlocked?"available":"locked";return <button key={item.id} className={`campaign-stage is-${state}`} disabled={!unlocked} onClick={()=>choose(item)}><span className="campaign-stage__node">{result?"✓":!unlocked?"●":String(item.order).padStart(2,"0")}</span><span className="campaign-stage__copy"><small>{t(item.conceptKey)}</small><strong>{t(item.titleKey)}</strong><span>{unlocked?t(item.instructionKey):t("campaign.locked")}</span>{result&&<b className="star-rating">{stars(result.stars)} · {result.bestBlocks} {t("common.blocks")} · {result.bestSteps} {t("common.steps")}</b>}</span><span className="campaign-stage__status">{t(`status.${state}`)}</span></button>})}</section></main>}
 return <main className="student-page challenge-workbench-page">
  <StudentHeader section={t("campaign.mode")} backLabel={t("common.back")} onBack={()=>{reset();setScreen("path");}}/>
  <section className="workbench-brief">
   <span className="challenge-progress">{t("practice.challenge")} {challenge.order} / {campaign.challenges.length}</span>
   <div className="workbench-brief__copy"><span className="eyebrow"><i/>{t(challenge.conceptKey)}</span><h1>{t(challenge.titleKey)}</h1><p>{t(challenge.instructionKey)}</p></div>
   <div className="workbench-brief__meta"><div className="target-banner"><b>{t("campaign.targets")}</b><span>≤ {challenge.parBlocks} {t("common.blocks")}</span><span>≤ {challenge.parSteps} {t("common.steps")}</span></div></div>
  </section>
  {(challenge.type==="predict"||challenge.type==="debug")&&<div className="student-evidence"><EvidenceForm key={challenge.id} challenge={challenge} value={evidence} onChange={setEvidence} disabled={running}/></div>}
  <div className="responsive-tabs"><button className={workbenchView==="program"?"is-active":""} onClick={()=>setWorkbenchView("program")}>{t("editor.route")}</button><button className={workbenchView==="world"?"is-active":""} onClick={()=>setWorkbenchView("world")}>{t("sim.title")}</button></div>
  <div className="mobile-run-bar"><button className="reset-button" onClick={reset}>↺ <span>{running?t("common.stop"):t("common.reset")}</span></button><button className="run-button" onClick={()=>void run()} disabled={running||(challenge.type==="predict"&&!evidence.prediction)}>{running?t("common.running"):t("common.run")}<span>▶</span></button></div>
  <section className={`editor-workspace show-${workbenchView}`}>
   <VisualEditor program={editor} allowed={challenge.allowed} onChange={edit} activePath={playback.activePath} conditionResult={playback.conditionResult} disabled={running||challenge.type==="predict"} onUndo={()=>setHistory(undoHistory)} onRedo={()=>setHistory(redoHistory)} canUndo={history.past.length>0} canRedo={history.future.length>0} onRestore={()=>edit(makeEditor(challenge.starter))}/>
   <section className="simulation-panel editor-simulation">
    <div className="sim-heading"><div><div className="section-kicker">{t("campaign.workspace")}</div><h2>{t("sim.title")}</h2></div><div className="sim-heading__actions"><div className="block-count"><strong>{countBlocks(executable)} / {challenge.parBlocks}</strong><span>{t("common.blocks")}</span></div><div className="run-controls run-controls--desktop"><button className="reset-button" onClick={reset}>↺ <span>{running?t("common.stop"):t("common.reset")}</span></button><button className="run-button" onClick={()=>void run()} disabled={running||(challenge.type==="predict"&&!evidence.prediction)}>{running?t("common.running"):t("common.run")}<span>▶</span></button></div></div></div>
    <TraceControls player={player} playback={playback}/>
    <GridWorld world={challenge.world} playback={playback} hideStatus={outcome!==null}/>
    {outcome&&!running&&<div className={`challenge-feedback ${outcome.complete?"is-complete":""}`}><strong>{outcome.complete?`${stars(outcome.stars)} ${t(`campaign.result.${outcome.stars}`)}`:t("sim.incomplete")}</strong><span>{t("sim.metrics",{blocks:outcome.blocks,steps:outcome.steps})}</span>{outcome.complete&&<button onClick={nextChallenge}>{challenge.order<campaign.challenges.length?t("common.next"):t("common.continue")} →</button>}</div>}
   </section>
  </section>
 </main>;
}
