import { EvidenceForm, emptyEvidence, saveAttemptEvidence } from "../Assessment.js";
import {
  assessAttempt,
  challengeWorlds,
  resolveChallengeWorld,
  type AssessmentEvidence,
  type CampaignDefinition,
  type LearnerEvidence,
  type PracticeChallengeDefinition,
} from "@kodergarden/shared";
import { TraceControls, useTracePlayer } from "../TracePlayer.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countBlocks, validateProgram, type Program } from "@kodergarden/language";
import { executeProgram, GridRuntime } from "@kodergarden/engine";
import { VisualEditor } from "../editor/VisualEditor.js";
import { commitHistory, createHistory, fromExecutableProgram, redoHistory, toExecutableProgram, undoHistory, type EditorProgram } from "../editor/model.js";
import { GridWorld } from "../GridWorld.js";
import { useI18n } from "../i18n.js";
import { initialPlaybackState } from "../playback.js";
import { PracticeGuidance, TraceInsight, type ActiveGuidance } from "../practice/PracticeGuidance.js";
import {
  containerGuidanceTools,
  emptyGuidanceProgress,
  guidanceOutcome,
  markGuidanceSeen,
  parseGuidanceProgress,
  PRACTICE_GUIDANCE_STORAGE_KEY,
  PRACTICE_GUIDANCE_VERSION,
  recordHintLevel,
  type GuidanceTool,
} from "../practice/guidance.js";
import { campaignChallengeUnlocked, loadCampaignProgress, recordCampaignRun, saveCampaignProgress, starsForRun, type CampaignProgress } from "./progress.js";
import campaignIcon from "../../../../resources/assets/home/icon_challenges.webp";
import { ProgressIndicator, StudentHeader } from "../student/StudentUi.js";

let identity = 0;
const makeEditor = (source: Program): EditorProgram => fromExecutableProgram(source, () => `campaign-${identity++}`);
const stars = (count: number): string => `${"★".repeat(count)}${"☆".repeat(3 - count)}`;
const loadGuidanceProgress = () => {
  try { return parseGuidanceProgress(JSON.parse(localStorage.getItem(PRACTICE_GUIDANCE_STORAGE_KEY) ?? "null")); }
  catch { return emptyGuidanceProgress(); }
};

interface CampaignOutcome {
  readonly complete: boolean;
  readonly goal: boolean;
  readonly allItemsCollected: boolean;
  readonly validCollections: boolean;
  readonly stars: 0 | 1 | 2 | 3;
  readonly blocks: number;
  readonly steps: number;
  readonly passed: number;
  readonly total: number;
  readonly firstFailingLayoutId: string | null;
  readonly withinBlockLimit: boolean;
  readonly requiredToolsUsed: boolean;
  readonly collisionFree: boolean;
  readonly safetyStop: boolean;
}

export function CampaignMode({ campaigns, onBack }: { readonly campaigns: readonly CampaignDefinition[]; readonly onBack: () => void }) {
  const advancedCampaigns = campaigns.filter((campaign) => campaign.kind === "advanced");
  const { t } = useI18n();
  const [screen, setScreen] = useState<"library" | "path" | "challenge">("library");
  const [campaign, setCampaign] = useState<CampaignDefinition>(advancedCampaigns[0]!);
  const [challenge, setChallenge] = useState<PracticeChallengeDefinition>(advancedCampaigns[0]!.challenges[0]!);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [activeWorld, setActiveWorld] = useState(challenge.world);
  const [progress, setProgress] = useState<CampaignProgress>(loadCampaignProgress);
  const [history, setHistory] = useState(() => createHistory(makeEditor(challenge.starter)));
  const [playback, setPlayback] = useState(() => initialPlaybackState(new GridRuntime(challenge.world).snapshot()));
  const player = useTracePlayer(setPlayback);
  const [evidence, setEvidence] = useState<LearnerEvidence>(emptyEvidence);
  const [, setEvidenceResult] = useState<AssessmentEvidence | null>(null);
  const [workbenchView, setWorkbenchView] = useState<"program" | "world">("program");
  const [outcome, setOutcome] = useState<CampaignOutcome | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const guidanceEnabled = import.meta.env.VITE_PRACTICE_GUIDANCE !== "false";
  const [guidanceProgress, setGuidanceProgress] = useState(loadGuidanceProgress);
  const [activeGuidance, setActiveGuidance] = useState<ActiveGuidance | null>(null);
  const controller = useRef<AbortController | null>(null);
  const editor = history.present;
  const executable = useMemo(() => challenge.type === "predict" ? challenge.starter : toExecutableProgram(editor), [editor, challenge]);
  const running = player.total > 0 && player.cursor < player.total;
  const initial = useCallback(() => new GridRuntime(activeWorld).snapshot(), [activeWorld]);
  const markObservedSupport = useCallback((kind: "interface" | "conceptual", hintLevel?: number) => setEvidence((current) => ({
    ...current,
    observedAssistance: current.observedAssistance === "conceptual" ? "conceptual" : kind,
    guidanceVersion: PRACTICE_GUIDANCE_VERSION,
    ...(hintLevel ? { hintLevel: Math.max(current.hintLevel ?? 0, hintLevel) } : {}),
  })), []);

  useEffect(() => {
    if (!guidanceEnabled) return;
    try { localStorage.setItem(PRACTICE_GUIDANCE_STORAGE_KEY, JSON.stringify(guidanceProgress)); }
    catch { /* Guidance still works without storage. */ }
  }, [guidanceEnabled, guidanceProgress]);
  useEffect(() => {
    player.cancel();
    controller.current?.abort();
    controller.current = null;
    setPlayback(initialPlaybackState(initial()));
    setOutcome(null);
    setEvidenceResult(null);
    setRunError(null);
  }, [executable, initial]);
  useEffect(() => () => controller.current?.abort(), []);

  const chooseCampaign = (next: CampaignDefinition) => { setCampaign(next); setScreen("path"); };
  const choose = (next: PracticeChallengeDefinition) => {
    controller.current?.abort();
    player.cancel();
    setChallenge(next);
    setEvidence(emptyEvidence());
    setEvidenceResult(null);
    controller.current = null;
    setActiveLayoutId(null);
    setActiveWorld(next.world);
    setHistory(createHistory(makeEditor(next.starter)));
    setPlayback(initialPlaybackState(new GridRuntime(next.world).snapshot()));
    setOutcome(null);
    setRunError(null);
    setActiveGuidance(null);
    setWorkbenchView("program");
    setScreen("challenge");
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  };
  const edit = (next: EditorProgram) => {
    player.cancel();
    setEvidenceResult(null);
    setHistory((current) => commitHistory(current, next));
    setOutcome(null);
    setRunError(null);
    setActiveGuidance(null);
  };
  const reset = useCallback(() => {
    controller.current?.abort();
    player.cancel();
    controller.current = null;
    setPlayback(initialPlaybackState(initial()));
    setOutcome(null);
    setRunError(null);
    setActiveGuidance(null);
  }, [initial]);
  const chooseLayout = (layoutId: string | null) => {
    controller.current?.abort();
    player.cancel();
    controller.current = null;
    const next = resolveChallengeWorld(challenge, layoutId);
    setActiveLayoutId(layoutId);
    setActiveWorld(next);
    setPlayback(initialPlaybackState(new GridRuntime(next).snapshot()));
    setOutcome(null);
    setRunError(null);
    setActiveGuidance(null);
  };
  const run = async () => {
    if (controller.current) return;
    const valid = validateProgram(executable);
    if (!valid.ok) { setRunError(t("guidance.validation")); setWorkbenchView("program"); return; }
    setRunError(null);
    setActiveGuidance(null);
    setWorkbenchView("world");
    setPlayback(initialPlaybackState(new GridRuntime(activeWorld).snapshot()));
    setOutcome(null);
    const blocks = countBlocks(valid.program);
    const result = executeProgram(valid.program, new GridRuntime(activeWorld));
    const control = new AbortController();
    controller.current = control;
    if (!await player.play(result, new GridRuntime(activeWorld).snapshot(), 1)) return;
    if (control.signal.aborted) return;
    controller.current = null;
    const evaluation = assessAttempt(challenge, valid.program, evidence, activeWorld);
    setEvidenceResult(evaluation.evidence);
    saveAttemptEvidence(challenge.id, evaluation.evidence);
    setEvidence((current) => ({ ...current, replayed: true }));
    const steps = Math.max(0, ...evaluation.layouts.map((layout) => layout.executionSteps));
    const rating = challenge.type === "predict"
      ? evaluation.complete ? 1 : 0
      : starsForRun(evaluation.complete, blocks, steps, challenge.parBlocks ?? Infinity, challenge.parSteps ?? Infinity);
    setOutcome({
      complete: evaluation.complete,
      goal: evaluation.goalReached,
      allItemsCollected: evaluation.allItemsCollected,
      validCollections: evaluation.validCollections,
      stars: rating,
      blocks,
      steps,
      passed: evaluation.layouts.filter((layout) => layout.succeeded && layout.collisions === 0 && layout.invalidCollections === 0).length,
      total: evaluation.layouts.length,
      firstFailingLayoutId: evaluation.firstFailingLayoutId,
      withinBlockLimit: evaluation.withinBlockLimit,
      requiredToolsUsed: evaluation.requiredToolsUsed,
      collisionFree: evaluation.collisionFree,
      safetyStop: evaluation.stoppedByLimit,
    });
    if (rating > 0) {
      setProgress((current) => {
        const next = recordCampaignRun(current, campaign.id, challenge.id, blocks, steps, rating as 1 | 2 | 3);
        saveCampaignProgress(next);
        return next;
      });
    }
  };
  const nextChallenge = () => {
    const next = campaign.challenges[challenge.order];
    if (next) choose(next);
    else setScreen("path");
  };

  if (screen === "library") {
    return <main className="student-page student-page--campaigns">
      <StudentHeader section={t("campaign.mode")} backLabel={t("live.home")} onBack={onBack}/>
      <section className="student-intro"><div><span className="eyebrow"><i/>{t("campaign.mode")}</span><h1>{t("campaign.library.title")}</h1><p>{t("campaign.library.body")}</p></div><img src={campaignIcon} alt="" aria-hidden="true" decoding="async"/></section>
      <section className="campaign-library campaign-library--refined">{advancedCampaigns.map((item) => {
        const results = progress.campaigns[item.id] ?? {};
        const activeIds = item.challenges.map((challengeItem) => challengeItem.id);
        const completed = Object.keys(results).filter((id) => activeIds.includes(id)).length;
        const totalStars = Object.entries(results).filter(([id]) => activeIds.includes(id)).reduce((sum, [, result]) => sum + result.stars, 0);
        return <button className="campaign-tile" key={item.id} onClick={() => chooseCampaign(item)}><span className="campaign-tile__art"><img src={campaignIcon} alt="" aria-hidden="true" loading="lazy" decoding="async"/></span><span className="campaign-tile__copy"><small>{t("campaign.label")} {item.order - 1}</small><strong>{t(item.titleKey)}</strong><span>{t(item.descriptionKey)}</span><ProgressIndicator value={completed} total={item.challenges.length} label={t("practice.progress", { done: completed, total: item.challenges.length })}/><b className="campaign-tile__stars">★ {totalStars} / {item.challenges.length * 3}</b><em>{t("campaign.open")} →</em></span></button>;
      })}</section>
    </main>;
  }
  if (screen === "path") {
    const ids = campaign.challenges.map((item) => item.id);
    const results = progress.campaigns[campaign.id] ?? {};
    const completed = Object.keys(results).filter((id) => ids.includes(id)).length;
    const totalStars = Object.entries(results).filter(([id]) => ids.includes(id)).reduce((sum, [, result]) => sum + result.stars, 0);
    return <main className="student-page student-page--path">
      <StudentHeader section={t("campaign.mode")} backLabel={t("campaign.all")} onBack={() => setScreen("library")}/>
      <section className="student-intro student-intro--compact"><div><span className="eyebrow"><i/>{t("campaign.mode")}</span><h1>{t(campaign.titleKey)}</h1><p>{t(campaign.descriptionKey)}</p><ProgressIndicator value={completed} total={campaign.challenges.length} label={t("campaign.summary", { done: completed, total: campaign.challenges.length, stars: totalStars, max: campaign.challenges.length * 3 })}/></div></section>
      <section className="campaign-stage-path" aria-label={t(campaign.titleKey)}>{campaign.challenges.map((item) => {
        const unlocked = campaignChallengeUnlocked(item.order, ids, progress, campaign.id);
        const result = results[item.id];
        const state = result ? "completed" : unlocked ? "available" : "locked";
        return <button key={item.id} className={`campaign-stage is-${state}`} disabled={!unlocked} onClick={() => choose(item)}><span className="campaign-stage__node">{result ? "✓" : !unlocked ? "●" : String(item.order).padStart(2, "0")}</span><span className="campaign-stage__copy"><small>{t(item.conceptKey)}{(item.worldVariants?.length ?? 0) > 0 ? ` · ${t("assessment.scope.case-family")}` : ""}</small><strong>{t(item.titleKey)}</strong><span>{unlocked ? t(item.instructionKey) : t("campaign.locked")}</span>{result && <b className="star-rating">{stars(result.stars)} · {result.bestBlocks} {t("common.blocks")} · {result.bestSteps} {t("common.steps")}</b>}</span><span className="campaign-stage__status">{t(`status.${state}`)}</span></button>;
      })}</section>
    </main>;
  }

  const layouts = challengeWorlds(challenge);
  const openHelpLibrary = () => { if (guidanceEnabled) { setActiveGuidance({ kind: "library" }); markObservedSupport("interface"); } };
  const openBlockHelp = (tool: GuidanceTool) => { if (guidanceEnabled) { setActiveGuidance({ kind: "block", tool, mode: "reference" }); markObservedSupport("conceptual"); } };
  const noteToolInserted = (tool: GuidanceTool) => {
    if (!guidanceEnabled || !containerGuidanceTools.includes(tool) || challenge.assessment?.occasion === "fresh" || challenge.assessment?.occasion === "delayed") return;
    const key = `${challenge.campaignId}:anatomy:${tool}`;
    if (guidanceProgress.seen.includes(key)) return;
    setGuidanceProgress((current) => markGuidanceSeen(current, key));
    setActiveGuidance({ kind: "block", tool, mode: "anatomy" });
    markObservedSupport("conceptual");
  };
  const openHint = () => {
    if (!guidanceEnabled || !outcome || outcome.complete) return;
    const category = guidanceOutcome(outcome);
    const key = `${challenge.campaignId}:${challenge.id}:${category}`;
    const level = Math.max(1, guidanceProgress.hints[key] ?? 0);
    setGuidanceProgress((current) => recordHintLevel(current, key, level));
    setActiveGuidance({ kind: "hint", outcome: category, level });
    markObservedSupport("conceptual", level);
  };
  const nextHint = () => {
    if (activeGuidance?.kind !== "hint") return;
    const level = Math.min(4, activeGuidance.level + 1);
    const key = `${challenge.campaignId}:${challenge.id}:${activeGuidance.outcome}`;
    setGuidanceProgress((current) => recordHintLevel(current, key, level));
    setActiveGuidance({ ...activeGuidance, level });
    markObservedSupport("conceptual", level);
  };
  const guidedTool = activeGuidance?.kind === "block" ? activeGuidance.tool : null;

  return <main className="student-page challenge-workbench-page campaign-workbench-page">
    <StudentHeader section={t("campaign.mode")} backLabel={t("common.back")} onBack={() => { reset(); setScreen("path"); }}/>
    <section className="workbench-brief">
      <span className="challenge-progress">{t("practice.challenge")} {challenge.order} / {campaign.challenges.length}</span>
      <div className="workbench-brief__copy"><span className="eyebrow"><i/>{t(challenge.conceptKey)}</span><h1>{t(challenge.titleKey)}</h1><p>{t(challenge.instructionKey)}</p></div>
      <div className="workbench-brief__meta"><div className="target-banner"><b>{t("campaign.targets")}</b><span>≤ {challenge.parBlocks} {t("common.blocks")}</span><span>≤ {challenge.parSteps} {t("common.steps")}</span></div>{evidence.observedAssistance && <span className={`guidance-support-chip is-${evidence.observedAssistance}`}>{t(`guidance.support.${evidence.observedAssistance}`)}</span>}</div>
    </section>
    {(challenge.type === "predict" || challenge.type === "debug") && <div className="student-evidence"><EvidenceForm key={challenge.id} challenge={challenge} value={evidence} onChange={setEvidence} disabled={running}/></div>}
    <div className="responsive-tabs"><button className={workbenchView === "program" ? "is-active" : ""} onClick={() => setWorkbenchView("program")}>{t("editor.route")}</button><button className={workbenchView === "world" ? "is-active" : ""} onClick={() => setWorkbenchView("world")}>{t("sim.title")}</button></div>
    {runError && <p className="program-validation" role="alert">{runError}</p>}
    <div className="mobile-run-bar"><button className="reset-button" onClick={reset}>↺ <span>{running ? t("common.stop") : t("common.reset")}</span></button><button className="run-button" onClick={() => void run()} disabled={running || (challenge.type === "predict" && !evidence.prediction)}>{running ? t("common.running") : t("common.run")}<span>▶</span></button></div>
    <section className={`editor-workspace show-${workbenchView}`}>
      <VisualEditor program={editor} allowed={challenge.allowed} onChange={edit} activePath={playback.activePath} conditionResult={playback.conditionResult} disabled={running || challenge.type === "predict"} onUndo={() => setHistory(undoHistory)} onRedo={() => setHistory(redoHistory)} canUndo={history.past.length > 0} canRedo={history.future.length > 0} onRestore={() => edit(makeEditor(challenge.starter))} onOpenBlockHelp={guidanceEnabled ? openBlockHelp : undefined} onOpenHelpLibrary={guidanceEnabled ? openHelpLibrary : undefined} onToolInserted={guidanceEnabled ? noteToolInserted : undefined} guidedTool={guidedTool}/>
      <section className="simulation-panel editor-simulation">
        <div className="sim-heading"><div><div className="section-kicker">{t("campaign.workspace")}</div><h2>{t("sim.title")}</h2></div><div className="sim-heading__actions"><div className="block-count"><strong>{countBlocks(executable)} / {challenge.parBlocks}</strong><span>{t("common.blocks")}</span></div><div className="run-controls run-controls--desktop"><button className="reset-button" onClick={reset}>↺ <span>{running ? t("common.stop") : t("common.reset")}</span></button><button className="run-button" onClick={() => void run()} disabled={running || (challenge.type === "predict" && !evidence.prediction)}>{running ? t("common.running") : t("common.run")}<span>▶</span></button></div></div></div>
        {layouts.length > 1 && <div className="layout-selector layout-selector--panel"><span>◇ {t("practice.allLayouts")}</span><div>{layouts.map((layout, index) => { const id = layout.id === "default" ? null : layout.id; return <button key={layout.id} aria-pressed={activeLayoutId === id} className={activeLayoutId === id ? "is-active" : ""} onClick={() => chooseLayout(id)} disabled={running}>{t("practice.garden", { number: index + 1 })}</button>; })}</div></div>}
        <TraceControls player={player} playback={playback}/>
        <TraceInsight playback={playback} program={executable}/>
        <GridWorld world={activeWorld} playback={playback} hideStatus={outcome !== null}/>
        {outcome && !running && <div className={`challenge-feedback ${outcome.complete ? "is-complete" : ""}`}><strong>{outcome.complete ? `${stars(outcome.stars)} ${t(`campaign.result.${outcome.stars}`)}` : challenge.type === "debug" && outcome.goal ? t("assessment.explanationRequired") : !outcome.goal ? t("sim.destinationMissing") : !outcome.allItemsCollected ? t("sim.itemsRemaining") : !outcome.validCollections ? t("sim.invalidCollectionResult") : !outcome.withinBlockLimit ? t("sim.blockLimit", { max: challenge.parBlocks ?? 0 }) : !outcome.requiredToolsUsed ? t("sim.requiredTool") : !outcome.collisionFree ? t("sim.collisionFree") : t("sim.incomplete")}</strong><span>{layouts.length > 1 ? t("sim.layouts", { passed: outcome.passed, total: outcome.total }) : t("sim.metrics", { blocks: outcome.blocks, steps: outcome.steps })}</span>{outcome.firstFailingLayoutId && <button onClick={() => chooseLayout(outcome.firstFailingLayoutId === "default" ? null : outcome.firstFailingLayoutId)}>{t("sim.showFailing")}</button>}{!outcome.complete && player.total > 0 && <button onClick={() => { player.reviewIssue(); setWorkbenchView("world"); }}>{t("guidance.reviewStep")}</button>}{guidanceEnabled && !outcome.complete && <button onClick={openHint}>{t("guidance.getHint")}</button>}{outcome.complete && <button onClick={nextChallenge}>{challenge.order < campaign.challenges.length ? t("common.next") : t("common.continue")} →</button>}</div>}
      </section>
    </section>
    {guidanceEnabled && <PracticeGuidance active={activeGuidance} allowed={challenge.allowed} onClose={() => setActiveGuidance(null)} onOpenTool={openBlockHelp} onNextHint={nextHint}/>}
  </main>;
}
