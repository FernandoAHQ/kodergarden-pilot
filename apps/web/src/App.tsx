import { EvidenceForm, emptyEvidence, saveAttemptEvidence } from "./Assessment.js";
import { assessAttempt, type AssessmentEvidence, type LearnerEvidence } from "@kodergarden/shared";
import { TraceControls, useTracePlayer } from "./TracePlayer.js";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { countBlocks, validateProgram, type Program } from "@kodergarden/language";
import { executeProgram, GridRuntime } from "@kodergarden/engine";
import { challengeWorlds, resolveChallengeWorld } from "@kodergarden/shared";
import { VisualEditor } from "./editor/VisualEditor.js";
import { commitHistory, createHistory, fromExecutableProgram, redoHistory, toExecutableProgram, undoHistory, type EditorProgram } from "./editor/model.js";
import { GridWorld } from "./GridWorld.js";
import { useI18n } from "./i18n.js";
import { initialPlaybackState } from "./playback.js";
import { availableTools, challenges, type PracticeChallenge } from "./practice/challenges.js";
import { completeChallenge, isUnlocked, loadProgress, saveProgress, type PracticeProgress } from "./practice/progress.js";
import { PracticeGuidance, TraceInsight, type ActiveGuidance } from "./practice/PracticeGuidance.js";
import { automaticGuidanceKey, containerGuidanceTools, emptyGuidanceProgress, guidanceOutcome, markGuidanceSeen, parseGuidanceProgress, PRACTICE_GUIDANCE_STORAGE_KEY, PRACTICE_GUIDANCE_VERSION, recordHintLevel, unlockGuidanceTool, type GuidanceTool } from "./practice/guidance.js";
import practiceIcon from "../../../resources/assets/home/icon_practice.webp";
import { ProgressIndicator, StudentHeader } from "./student/StudentUi.js";

let identity=0;
const makeEditor=(source:Program):EditorProgram=>fromExecutableProgram(source,()=>`practice-${identity++}`);
const loadGuidanceProgress=()=>{try{return parseGuidanceProgress(JSON.parse(localStorage.getItem(PRACTICE_GUIDANCE_STORAGE_KEY)??"null"));}catch{return emptyGuidanceProgress();}};

export function PracticeMode({challenges,onBack,curriculumControl}:{readonly challenges:readonly PracticeChallenge[];readonly onBack:()=>void;readonly curriculumControl?:ReactNode}){
 const {t}=useI18n();
 const [screen,setScreen]=useState<"home"|"challenge">("home");
 const [challenge,setChallenge]=useState<PracticeChallenge>(challenges[0]!);
 const [activeLayoutId,setActiveLayoutId]=useState<string|null>(null);
 const [activeWorld,setActiveWorld]=useState(challenges[0]!.world);
 const [progress,setProgress]=useState<PracticeProgress>(loadProgress);
 const [history,setHistory]=useState(()=>createHistory(makeEditor(challenges[0]!.starter)));
 const editor=history.present;
 const initial=useCallback(()=>new GridRuntime(activeWorld).snapshot(),[activeWorld]);
 const [playback,setPlayback]=useState(()=>initialPlaybackState(new GridRuntime(challenges[0]!.world).snapshot())); const player = useTracePlayer(setPlayback);
 const speed=1;
 const [evidence,setEvidence]=useState<LearnerEvidence>(emptyEvidence); const [,setEvidenceResult]=useState<AssessmentEvidence|null>(null);
 const [outcome,setOutcome]=useState<{complete:boolean;goal:boolean;allItemsCollected:boolean;validCollections:boolean;blocks:number;steps:number;passed:number;total:number;firstFailingLayoutId:string|null;withinBlockLimit:boolean;requiredToolsUsed:boolean;collisionFree:boolean;safetyStop:boolean}|null>(null);
 const [workbenchView,setWorkbenchView]=useState<"program"|"world">("program");
 const guidanceEnabled=import.meta.env.VITE_PRACTICE_GUIDANCE!=="false";
 const [guidanceProgress,setGuidanceProgress]=useState(loadGuidanceProgress);
 const [activeGuidance,setActiveGuidance]=useState<ActiveGuidance|null>(null);
 const [runError,setRunError]=useState<string|null>(null);
 const controller=useRef<AbortController|null>(null);
 const executable=useMemo(()=>challenge.type==="predict"?challenge.starter:toExecutableProgram(editor),[editor,challenge]);
 const running=player.total>0&&player.cursor<player.total;
 const markObservedSupport=useCallback((kind:"interface"|"conceptual",hintLevel?:number)=>setEvidence(current=>({...current,observedAssistance:current.observedAssistance==="conceptual"?"conceptual":kind,guidanceVersion:PRACTICE_GUIDANCE_VERSION,...(hintLevel?{hintLevel:Math.max(current.hintLevel??0,hintLevel)}:{})})),[]);
 useEffect(()=>{if(!guidanceEnabled)return;try{localStorage.setItem(PRACTICE_GUIDANCE_STORAGE_KEY,JSON.stringify(guidanceProgress));}catch{/* Guidance still works without storage. */}},[guidanceEnabled,guidanceProgress]);
 useEffect(()=>{if(!guidanceEnabled||screen!=="challenge")return;const automaticKey=automaticGuidanceKey(challenge);if(!automaticKey)return;const key=`${challenge.campaignId??"practice"}:${automaticKey}`;if(guidanceProgress.seen.includes(key))return;setGuidanceProgress(current=>markGuidanceSeen(current,key));if(automaticKey==="orientation"){setActiveGuidance({kind:"orientation"});markObservedSupport("interface");}else if(automaticKey==="family"){setActiveGuidance({kind:"family"});markObservedSupport("conceptual");}else{const tool=unlockGuidanceTool(challenge);if(tool){setActiveGuidance({kind:"block",tool,mode:"coach"});markObservedSupport("conceptual");}}},[challenge,guidanceEnabled,guidanceProgress.seen,markObservedSupport,screen]);
 useEffect(()=>{player.cancel();controller.current?.abort();controller.current=null;setPlayback(initialPlaybackState(initial()));setOutcome(null);setEvidenceResult(null);setRunError(null);},[executable]);
 const choose=(next:PracticeChallenge)=>{controller.current?.abort();player.cancel();setChallenge(next);setEvidence(emptyEvidence());setEvidenceResult(null);controller.current=null;setActiveLayoutId(null);setActiveWorld(next.world);setHistory(createHistory(makeEditor(next.starter)));setPlayback(initialPlaybackState(new GridRuntime(next.world).snapshot()));setOutcome(null);setRunError(null);setActiveGuidance(null);setWorkbenchView("program");setScreen("challenge");requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"auto"}));};
 const edit=(next:EditorProgram)=>{player.cancel();setEvidenceResult(null);setHistory(current=>commitHistory(current,next));setOutcome(null);setRunError(null);setActiveGuidance(null);};
 const reset=useCallback(()=>{controller.current?.abort();player.cancel();controller.current=null;setPlayback(initialPlaybackState(initial()));setOutcome(null);setRunError(null);setActiveGuidance(null);},[initial]);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const run=async()=>{if(controller.current)return;const valid=validateProgram(executable);if(!valid.ok){setRunError(t("guidance.validation"));setWorkbenchView("program");return;}setRunError(null);setActiveGuidance(null);setWorkbenchView("world");setPlayback(initialPlaybackState(new GridRuntime(activeWorld).snapshot()));setOutcome(null);const blocks=countBlocks(valid.program);const result=executeProgram(valid.program,new GridRuntime(activeWorld));const control=new AbortController();controller.current=control;if (!await player.play(result, new GridRuntime(activeWorld).snapshot(), speed)) return;if(control.signal.aborted)return;controller.current=null;const evaluation=assessAttempt(challenge,valid.program,evidence,activeWorld);setEvidenceResult(evaluation.evidence);saveAttemptEvidence(challenge.id,evaluation.evidence);setEvidence(current=>({...current,replayed:true}));setOutcome({complete:evaluation.complete,goal:evaluation.goalReached,allItemsCollected:evaluation.allItemsCollected,validCollections:evaluation.validCollections,blocks,steps:result.executionSteps,passed:evaluation.layouts.filter(layout=>layout.succeeded&&layout.collisions===0&&layout.invalidCollections===0).length,total:evaluation.layouts.length,firstFailingLayoutId:evaluation.firstFailingLayoutId,withinBlockLimit:evaluation.withinBlockLimit,requiredToolsUsed:evaluation.requiredToolsUsed,collisionFree:evaluation.collisionFree,safetyStop:result.stoppedByLimit});if(evaluation.complete){setProgress(current=>{const next=completeChallenge(current,challenge.id);saveProgress(next);return next;});}};
 const chooseLayout=(layoutId:string|null)=>{controller.current?.abort();player.cancel();controller.current=null;const next=resolveChallengeWorld(challenge,layoutId);setActiveLayoutId(layoutId);setActiveWorld(next);setPlayback(initialPlaybackState(new GridRuntime(next).snapshot()));setOutcome(null);setRunError(null);setActiveGuidance(null);};
 const nextChallenge=()=>{const next=challenges[challenge.order];if(next)choose(next);else setScreen("home");};
 if(screen==="home")return <main className="student-page student-page--practice"><StudentHeader section={t("brand.mode")} backLabel={t("live.home")} onBack={onBack} controls={curriculumControl}/><section className="student-intro"><div><span className="eyebrow"><i/>{t("brand.mode")}</span><h1>{t("practice.title")}</h1><p>{t("practice.subtitle")}</p><ProgressIndicator value={challenges.filter(item=>progress.completed.includes(item.id)).length} total={challenges.length} label={t("practice.progress",{done:challenges.filter(item=>progress.completed.includes(item.id)).length,total:challenges.length})}/></div><img src={practiceIcon} alt="" aria-hidden="true" decoding="async"/></section><section className="student-level-grid" aria-label={t("practice.title")}>{challenges.map(item=>{const unlocked=isUnlocked(item.order,progress,challenges.map(x=>x.id));const done=progress.completed.includes(item.id);const state=done?"completed":unlocked?"available":"locked";return <button key={item.id} className={`level-card is-${state}`} disabled={!unlocked} onClick={()=>choose(item)}><span className="level-card__number">{done?"✓":!unlocked?"●":String(item.order).padStart(2,"0")}</span><span className="level-card__copy"><small>{t("practice.concept")}: {t(item.conceptKey)}</small><strong>{t(item.titleKey)}</strong><span>{unlocked?t(item.instructionKey,item.maxBlocks?{max:item.maxBlocks}:{}):t("practice.locked")}</span></span><span className="level-card__status">{t(`status.${state}`)}</span></button>})}</section></main>;
 const layouts=challengeWorlds(challenge);
 const editorTools=availableTools(challenge);
 const openHelpLibrary=()=>{if(!guidanceEnabled)return;setActiveGuidance({kind:"library"});markObservedSupport("interface");};
 const openBlockHelp=(tool:GuidanceTool)=>{if(!guidanceEnabled)return;setActiveGuidance({kind:"block",tool,mode:"reference"});markObservedSupport("conceptual");};
 const noteToolInserted=(tool:GuidanceTool)=>{if(!guidanceEnabled||!containerGuidanceTools.includes(tool)||challenge.assessment?.occasion==="fresh"||challenge.assessment?.occasion==="delayed")return;const key=`${challenge.campaignId??"practice"}:anatomy:${tool}`;if(guidanceProgress.seen.includes(key))return;setGuidanceProgress(current=>markGuidanceSeen(current,key));setActiveGuidance({kind:"block",tool,mode:"anatomy"});markObservedSupport("conceptual");};
 const openHint=()=>{if(!guidanceEnabled||!outcome||outcome.complete)return;const category=guidanceOutcome(outcome);const key=`${challenge.campaignId??"practice"}:${challenge.id}:${category}`;const level=Math.max(1,guidanceProgress.hints[key]??0);setGuidanceProgress(current=>recordHintLevel(current,key,level));setActiveGuidance({kind:"hint",outcome:category,level});markObservedSupport("conceptual",level);};
 const nextHint=()=>{if(activeGuidance?.kind!=="hint")return;const level=Math.min(4,activeGuidance.level+1);const key=`${challenge.campaignId??"practice"}:${challenge.id}:${activeGuidance.outcome}`;setGuidanceProgress(current=>recordHintLevel(current,key,level));setActiveGuidance({...activeGuidance,level});markObservedSupport("conceptual",level);};
 const guidedTool=activeGuidance?.kind==="block"?activeGuidance.tool:null;
 return <main className="student-page challenge-workbench-page">
  <StudentHeader section={t("brand.mode")} backLabel={t("common.back")} onBack={()=>{reset();setScreen("home");}} controls={curriculumControl}/>
  <section className="workbench-brief">
   <span className="challenge-progress">{t("practice.challenge")} {challenge.order} / {challenges.length}</span>
   <div className="workbench-brief__copy"><span className="eyebrow"><i/>{t(challenge.conceptKey)}</span><h1>{t(challenge.titleKey)}</h1><p>{t(challenge.instructionKey,challenge.maxBlocks?{max:challenge.maxBlocks}:{})}</p></div>
   <div className="workbench-brief__meta">
    {challenge.assessment?.correctness==="discovery"&&challenge.parBlocks!==undefined&&<span className="workbench-goal">{t("assessment.optionalTarget",{blocks:challenge.parBlocks})}</span>}
    {evidence.observedAssistance&&<span className={`guidance-support-chip is-${evidence.observedAssistance}`}>{t(`guidance.support.${evidence.observedAssistance}`)}</span>}
    {challenge.unlockKey&&<div className="unlock-banner"><b>{t("practice.newTool")}</b><strong>{t(`unlock.${challenge.unlockKey}.title`)}</strong><span>{t(`unlock.${challenge.unlockKey}.body`)}</span>{guidanceEnabled&&unlockGuidanceTool(challenge)&&<button type="button" onClick={()=>openBlockHelp(unlockGuidanceTool(challenge)!)}>{t("guidance.showMe")}</button>}</div>}
   </div>
  </section>
  {(challenge.type==="predict"||challenge.type==="debug")&&<div className="student-evidence"><EvidenceForm key={challenge.id} challenge={challenge} value={evidence} onChange={setEvidence} disabled={running}/></div>}
  <div className="responsive-tabs"><button className={workbenchView==="program"?"is-active":""} onClick={()=>setWorkbenchView("program")}>{t("editor.route")}</button><button className={workbenchView==="world"?"is-active":""} onClick={()=>setWorkbenchView("world")}>{t("sim.title")}</button></div>
  {runError&&<p className="program-validation" role="alert">{runError}</p>}
  <div className="mobile-run-bar"><button className="reset-button" onClick={reset}>↺ <span>{running?t("common.stop"):t("common.reset")}</span></button><button className="run-button" onClick={()=>void run()} disabled={running||(challenge.type==="predict"&&!evidence.prediction)}>{running?t("common.running"):t("common.run")}<span>▶</span></button></div>
  <section className={`editor-workspace show-${workbenchView}`}>
   <VisualEditor program={editor} allowed={editorTools} onChange={edit} activePath={playback.activePath} conditionResult={playback.conditionResult} disabled={running||challenge.type==="predict"} onUndo={()=>setHistory(undoHistory)} onRedo={()=>setHistory(redoHistory)} canUndo={history.past.length>0} canRedo={history.future.length>0} onRestore={()=>edit(makeEditor(challenge.starter))} onOpenBlockHelp={guidanceEnabled?openBlockHelp:undefined} onOpenHelpLibrary={guidanceEnabled?openHelpLibrary:undefined} onToolInserted={guidanceEnabled?noteToolInserted:undefined} guidedTool={guidedTool}/>
   <section className="simulation-panel editor-simulation">
    <div className="sim-heading"><div><div className="section-kicker">{t("practice.workspace")}</div><h2>{t("sim.title")}</h2></div><div className="sim-heading__actions"><div className="block-count"><strong>{countBlocks(executable)}{challenge.maxBlocks?` / ${challenge.maxBlocks}`:""}</strong><span>{t("common.blocks")}</span></div><div className="run-controls run-controls--desktop"><button className="reset-button" onClick={reset}>↺ <span>{running?t("common.stop"):t("common.reset")}</span></button><button className="run-button" onClick={()=>void run()} disabled={running||(challenge.type==="predict"&&!evidence.prediction)}>{running?t("common.running"):t("common.run")}<span>▶</span></button></div></div></div>
    {layouts.length>1&&<div className="layout-selector layout-selector--panel"><span>◇ {t("practice.allLayouts")}</span><div>{layouts.map((layout,index)=>{const id=layout.id==="default"?null:layout.id;return <button key={layout.id} aria-pressed={activeLayoutId===id} className={activeLayoutId===id?"is-active":""} onClick={()=>chooseLayout(id)} disabled={running}>{t("practice.garden",{number:index+1})}</button>})}</div></div>}
    <TraceControls player={player} playback={playback}/>
    <TraceInsight playback={playback} program={executable}/>
    <GridWorld world={activeWorld} playback={playback} hideStatus={outcome!==null}/>
    {outcome&&!running&&<div className={`challenge-feedback ${outcome.complete?"is-complete":""}`}><strong>{challenge.type==="predict"?t(outcome.complete?"assessment.prediction.correct":"assessment.prediction.incorrect"):outcome.complete?t("sim.success"):challenge.type==="debug"&&outcome.goal?t("assessment.explanationRequired"):!outcome.goal?t("sim.destinationMissing"):!outcome.allItemsCollected?t("sim.itemsRemaining"):!outcome.validCollections?t("sim.invalidCollectionResult"):!outcome.withinBlockLimit?t("sim.blockLimit",{max:challenge.maxBlocks??0}):!outcome.requiredToolsUsed?t("sim.requiredTool"):!outcome.collisionFree?t("sim.collisionFree"):t("sim.incomplete")}</strong><span>{layouts.length>1?t("sim.layouts",{passed:outcome.passed,total:outcome.total}):t("sim.metrics",{blocks:outcome.blocks,steps:outcome.steps})}</span>{outcome.firstFailingLayoutId&&<button onClick={()=>chooseLayout(outcome.firstFailingLayoutId==="default"?null:outcome.firstFailingLayoutId)}>{t("sim.showFailing")}</button>}{!outcome.complete&&player.total>0&&<button onClick={()=>{player.reviewIssue();setWorkbenchView("world");}}>{t("guidance.reviewStep")}</button>}{guidanceEnabled&&!outcome.complete&&<button onClick={openHint}>{t("guidance.getHint")}</button>}{outcome.complete&&<button onClick={nextChallenge}>{challenge.order<challenges.length?t("common.next"):t("common.continue")} →</button>}</div>}
   </section>
  </section>
  {guidanceEnabled&&<PracticeGuidance active={activeGuidance} allowed={editorTools} onClose={()=>setActiveGuidance(null)} onOpenTool={openBlockHelp} onNextHint={nextHint}/>}
 </main>;
}
