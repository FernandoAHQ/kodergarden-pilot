import { randomInt, randomUUID } from "node:crypto";
import { Inject, Injectable, OnModuleDestroy, Optional } from "@nestjs/common";
import { executeProgram, GridRuntime } from "@kodergarden/engine";
import { countBlocks, validateProgram, type Program } from "@kodergarden/language";
import { allChallenges, evaluateLiveChallenge, statementAllowed, type LiveErrorCode, type LiveSessionSnapshot, type ParticipantSummary, type PilotSessionExport, type PracticeChallengeDefinition, type SelectedSubmission, type SubmissionSummary } from "@kodergarden/shared";

interface ParticipantRecord { readonly id: string; readonly token: string; readonly name: string; connected: boolean }
interface SubmissionRecord extends SubmissionSummary { readonly program: Program }
interface RoundParticipantRecord { attempts: number; final: SubmissionRecord | null }
interface RoundRecord { readonly id: string; readonly campaignId: string; readonly challengeId: string; readonly startedAt: number; closedAt: number | null; readonly participants: Map<string, RoundParticipantRecord> }
interface SessionRecord {
  readonly id: string; readonly code: string; readonly teacherToken: string; readonly createdAt: number;
  lastActivityAt: number; teacherConnected: boolean; phase: LiveSessionSnapshot["phase"];
  activeCampaignId: string | null; activeChallengeId: string | null; roundId: string | null; selectedParticipantId: string | null;
  readonly participants: Map<string, ParticipantRecord>; readonly submissions: Map<string, SubmissionRecord>; readonly rounds: RoundRecord[];
}

export class LiveDomainError extends Error { constructor(readonly code: LiveErrorCode, message: string) { super(message); } }
export interface SessionLogEvent { readonly event: string; readonly at: number; readonly sessionId?: string | undefined; readonly code?: string | undefined; readonly participantId?: string | undefined; readonly displayName?: string | undefined; readonly campaignId?: string | undefined; readonly challengeId?: string | undefined; readonly roundId?: string | undefined; readonly correct?: boolean | undefined; readonly blockCount?: number | undefined; readonly executionSteps?: number | undefined; readonly reason?: string | undefined }
export interface LiveSessionOptions {
  readonly codeGenerator?: () => string; readonly tokenGenerator?: () => string; readonly clock?: () => number;
  readonly challenges?: readonly PracticeChallengeDefinition[]; readonly sessionTtlMs?: number; readonly sweepIntervalMs?: number;
  readonly logger?: (event: SessionLogEvent) => void;
}

@Injectable()
export class LiveSessionService implements OnModuleDestroy {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly codeGenerator: () => string; private readonly tokenGenerator: () => string; private readonly clock: () => number;
  private readonly catalog: readonly PracticeChallengeDefinition[]; private readonly sessionTtlMs: number;
  private readonly logger: (event: SessionLogEvent) => void; private readonly cleanupTimer: ReturnType<typeof setInterval> | null;

  constructor(@Optional() @Inject("LIVE_SESSION_OPTIONS") options: LiveSessionOptions = {}) {
    this.codeGenerator = options.codeGenerator ?? (() => String(randomInt(100000, 1000000)));
    this.tokenGenerator = options.tokenGenerator ?? randomUUID; this.clock = options.clock ?? Date.now;
    this.catalog = options.challenges ?? allChallenges; this.sessionTtlMs = options.sessionTtlMs ?? 4 * 60 * 60 * 1000;
    this.logger = options.logger ?? ((event) => console.info(JSON.stringify({ scope: "live-session", ...event })));
    const interval = options.sweepIntervalMs ?? 60_000;
    this.cleanupTimer = interval > 0 ? setInterval(() => this.cleanupExpired(), interval) : null; this.cleanupTimer?.unref();
  }
  onModuleDestroy(): void { if (this.cleanupTimer) clearInterval(this.cleanupTimer); }

  createSession(): { readonly teacherToken: string; readonly snapshot: LiveSessionSnapshot } {
    this.cleanupExpired(); let code = "";
    for (let attempt = 0; attempt < 100; attempt += 1) { const candidate = this.codeGenerator().replace(/\D/g, "").padStart(6, "0").slice(-6); if (![...this.sessions.values()].some((session) => session.code === candidate)) { code = candidate; break; } }
    if (!code) throw new LiveDomainError("INVALID_CODE", "Unable to allocate a join code");
    const now = this.clock(); const teacherToken = this.tokenGenerator();
    const session: SessionRecord = { id: this.tokenGenerator(), code, teacherToken, createdAt: now, lastActivityAt: now, teacherConnected: true, phase: "LOBBY", activeCampaignId: null, activeChallengeId: null, roundId: null, selectedParticipantId: null, participants: new Map(), submissions: new Map(), rounds: [] };
    this.sessions.set(session.id, session); this.log("session.created", session); return { teacherToken, snapshot: this.teacherSnapshot(session) };
  }
  reconnectTeacher(token: string): LiveSessionSnapshot { const session = this.requireTeacher(token); session.teacherConnected = true; this.touch(session); this.log("teacher.reconnected", session); return this.teacherSnapshot(session); }
  joinParticipant(codeInput: string, nameInput: string): { readonly participantToken: string; readonly participantId: string; readonly snapshot: LiveSessionSnapshot } {
    this.cleanupExpired(); const code = codeInput.replace(/\D/g, ""); const session = [...this.sessions.values()].find((candidate) => candidate.code === code && candidate.phase !== "ENDED");
    if (!session) throw new LiveDomainError("SESSION_NOT_FOUND", "Session not found");
    const name = nameInput.trim().replace(/\s+/g, " "); if (name.length < 1 || name.length > 30) throw new LiveDomainError("INVALID_NAME", "Name must be between 1 and 30 characters");
    if ([...session.participants.values()].some((participant) => participant.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new LiveDomainError("NAME_TAKEN", "That name is already in this session");
    const participant: ParticipantRecord = { id: this.tokenGenerator(), token: this.tokenGenerator(), name, connected: true }; session.participants.set(participant.id, participant); this.touch(session);
    this.log("participant.joined", session, { participantId: participant.id, displayName: participant.name }); return { participantToken: participant.token, participantId: participant.id, snapshot: this.studentSnapshot(session, participant.id) };
  }
  reconnectParticipant(token: string): { readonly participantToken: string; readonly participantId: string; readonly snapshot: LiveSessionSnapshot } {
    const { session, participant } = this.requireParticipant(token); participant.connected = true; this.touch(session); this.log("participant.reconnected", session, { participantId: participant.id, displayName: participant.name });
    return { participantToken: participant.token, participantId: participant.id, snapshot: this.studentSnapshot(session, participant.id) };
  }
  selectCampaign(teacherToken: string, campaignId: string): LiveSessionSnapshot {
    const session = this.requireTeacher(teacherToken); this.requirePhase(session, ["LOBBY", "REVIEW"]); if (!this.catalog.some((challenge) => challenge.campaignId === campaignId)) throw new LiveDomainError("INVALID_CHALLENGE", "Campaign not found");
    session.activeCampaignId = campaignId; session.activeChallengeId = null; session.selectedParticipantId = null; session.submissions.clear(); this.touch(session); this.log("campaign.selected", session, { campaignId }); return this.teacherSnapshot(session);
  }
  selectChallenge(teacherToken: string, challengeId: string): LiveSessionSnapshot {
    const session = this.requireTeacher(teacherToken); this.requirePhase(session, ["LOBBY", "REVIEW"]); if (!session.activeCampaignId) throw new LiveDomainError("INVALID_CHALLENGE", "Choose a campaign first"); if (!this.catalog.some((challenge) => challenge.id === challengeId && challenge.campaignId === session.activeCampaignId)) throw new LiveDomainError("INVALID_CHALLENGE", "Challenge is not in the selected campaign");
    session.activeChallengeId = challengeId; session.selectedParticipantId = null; session.phase = "CHALLENGE_PREVIEW"; this.touch(session); this.log("challenge.selected", session, { challengeId }); return this.teacherSnapshot(session);
  }
  startChallenge(teacherToken: string): LiveSessionSnapshot {
    const session = this.requireTeacher(teacherToken); this.requirePhase(session, ["CHALLENGE_PREVIEW"]); if (!session.activeCampaignId || !session.activeChallengeId) throw new LiveDomainError("INVALID_CHALLENGE", "Choose a campaign and challenge first");
    const now = this.clock(); session.roundId = this.tokenGenerator(); session.submissions.clear(); session.selectedParticipantId = null; session.phase = "PROGRAMMING";
    session.rounds.push({ id: session.roundId, campaignId: session.activeCampaignId, challengeId: session.activeChallengeId, startedAt: now, closedAt: null, participants: new Map() }); this.touch(session, now); this.log("challenge.started", session, { campaignId: session.activeCampaignId, challengeId: session.activeChallengeId, roundId: session.roundId }); return this.teacherSnapshot(session);
  }
  submitSolution(participantToken: string, roundId: string, challengeId: string, input: unknown): LiveSessionSnapshot {
    const { session, participant } = this.requireParticipant(participantToken);
    const reject = (code: LiveErrorCode, message: string): never => { this.log("submission.rejected", session, { participantId: participant.id, challengeId, roundId, reason: code }); throw new LiveDomainError(code, message); };
    this.log("submission.received", session, { participantId: participant.id, challengeId, roundId });
    if (session.phase !== "PROGRAMMING") reject("SUBMISSIONS_CLOSED", "Submissions are closed"); if (session.roundId !== roundId || session.activeChallengeId !== challengeId) reject("ROUND_MISMATCH", "This solution belongs to a different round");
    const challenge = this.catalog.find((candidate) => candidate.id === challengeId && candidate.campaignId === session.activeCampaignId); if (!challenge) return reject("INVALID_CHALLENGE", "Challenge not found");
    const validated = validateProgram(input, { maxBlocks: 100, maxDepth: 8, maxRepeatCount: 100 }); if (!validated.ok) return reject("INVALID_SUBMISSION", "The submitted program is invalid for this challenge"); if (!validated.program.statements.every((statement) => statementAllowed(statement, challenge.allowed))) return reject("INVALID_SUBMISSION", "The submitted program is invalid for this challenge");
    const blockCount = countBlocks(validated.program); const result = executeProgram(validated.program, new GridRuntime(challenge.world), { maxSteps: 1000 }); const correct = evaluateLiveChallenge(challenge, result.succeeded, blockCount).complete; const submittedAt = this.clock();
    const submission: SubmissionRecord = { participantId: participant.id, program: validated.program, correct, blockCount, executionSteps: result.executionSteps, submittedAt }; const resubmission = session.submissions.has(participant.id); session.submissions.set(participant.id, submission);
    const round = session.rounds.at(-1); if (round?.id === roundId) { const record = round.participants.get(participant.id) ?? { attempts: 0, final: null }; record.attempts += 1; record.final = submission; round.participants.set(participant.id, record); }
    this.touch(session, submittedAt); this.log(resubmission ? "submission.resubmitted" : "submission.accepted", session, { participantId: participant.id, challengeId, roundId, correct, blockCount, executionSteps: result.executionSteps }); return this.studentSnapshot(session, participant.id);
  }
  closeSubmissions(teacherToken: string): LiveSessionSnapshot {
    const session = this.requireTeacher(teacherToken); this.requirePhase(session, ["PROGRAMMING"]); const now = this.clock(); session.phase = "REVIEW"; const round = session.rounds.at(-1); if (round?.id === session.roundId) round.closedAt = now; this.touch(session, now); this.log("submissions.closed", session, { challengeId: session.activeChallengeId ?? undefined, roundId: session.roundId ?? undefined }); return this.teacherSnapshot(session);
  }
  selectSubmission(teacherToken: string, participantId: string): LiveSessionSnapshot {
    const session = this.requireTeacher(teacherToken); this.requirePhase(session, ["REVIEW"]); if (!session.submissions.has(participantId)) throw new LiveDomainError("INVALID_SUBMISSION", "This participant has no submission"); session.selectedParticipantId = participantId; session.phase = "PLAYBACK"; this.touch(session); this.log("solution.selected", session, { participantId, challengeId: session.activeChallengeId ?? undefined, roundId: session.roundId ?? undefined }); return this.teacherSnapshot(session);
  }
  quickPick(teacherToken: string, strategy: "random" | "fewest" | "earliest"): LiveSessionSnapshot {
    const session = this.requireTeacher(teacherToken); this.requirePhase(session, ["REVIEW"]); let submissions = [...session.submissions.values()]; if (strategy !== "random") submissions = submissions.filter((submission) => submission.correct); if (submissions.length === 0) throw new LiveDomainError("INVALID_SUBMISSION", "No matching submissions yet");
    submissions.sort((left, right) => strategy === "fewest" ? left.blockCount - right.blockCount || left.submittedAt - right.submittedAt || left.participantId.localeCompare(right.participantId) : strategy === "earliest" ? left.submittedAt - right.submittedAt || left.participantId.localeCompare(right.participantId) : left.participantId.localeCompare(right.participantId));
    return this.selectSubmission(teacherToken, (strategy === "random" ? submissions[randomInt(0, submissions.length)]! : submissions[0]!).participantId);
  }
  returnToReview(teacherToken: string): LiveSessionSnapshot { const session = this.requireTeacher(teacherToken); this.requirePhase(session, ["PLAYBACK"]); session.selectedParticipantId = null; session.phase = "REVIEW"; this.touch(session); this.log("playback.review-returned", session, { challengeId: session.activeChallengeId ?? undefined, roundId: session.roundId ?? undefined }); return this.teacherSnapshot(session); }
  exportSession(teacherToken: string): PilotSessionExport {
    const session = this.requireTeacher(teacherToken); const exportedAt = this.clock(); this.touch(session, exportedAt);
    return { sessionId: session.id, code: session.code, startedAt: session.createdAt, exportedAt, phase: session.phase, rounds: session.rounds.map((round) => ({ roundId: round.id, campaignId: round.campaignId, challengeId: round.challengeId, startedAt: round.startedAt, closedAt: round.closedAt, participants: [...session.participants.values()].map((participant) => { const record = round.participants.get(participant.id); return { participantId: participant.id, displayName: participant.name, submitted: Boolean(record?.final), submissionAttempts: record?.attempts ?? 0, resubmissions: Math.max(0, (record?.attempts ?? 0) - 1), correct: record?.final?.correct ?? null, blockCount: record?.final?.blockCount ?? null, executionSteps: record?.final?.executionSteps ?? null, submittedAt: record?.final?.submittedAt ?? null }; }) })) };
  }
  endSession(teacherToken: string): LiveSessionSnapshot { const session = this.requireTeacher(teacherToken); session.phase = "ENDED"; this.touch(session); this.log("session.ended", session); const snapshot = this.teacherSnapshot(session); this.sessions.delete(session.id); return snapshot; }
  setDisconnected(token: string): string | null {
    const teacher = this.findTeacher(token); if (teacher) { teacher.teacherConnected = false; this.touch(teacher); this.log("teacher.disconnected", teacher); return teacher.id; }
    const found = this.findParticipant(token); if (found) { found.participant.connected = false; this.touch(found.session); this.log("participant.disconnected", found.session, { participantId: found.participant.id, displayName: found.participant.name }); return found.session.id; } return null;
  }
  cleanupExpired(now = this.clock()): number { let removed = 0; for (const [id, session] of this.sessions) { if (now - session.lastActivityAt < this.sessionTtlMs) continue; this.log("session.expired", session, { reason: "inactivity" }, now); this.sessions.delete(id); removed += 1; } return removed; }
  getSessionCount(): number { return this.sessions.size; }
  getSessionIdForTeacher(token: string): string { return this.requireTeacher(token).id; } getSessionIdForParticipant(token: string): string { return this.requireParticipant(token).session.id; }
  getTeacherSnapshot(token: string): LiveSessionSnapshot { return this.teacherSnapshot(this.requireTeacher(token)); } getStudentSnapshot(token: string): LiveSessionSnapshot { const { session, participant } = this.requireParticipant(token); return this.studentSnapshot(session, participant.id); }

  private teacherSnapshot(session: SessionRecord): LiveSessionSnapshot { return this.snapshot(session, true); } private studentSnapshot(session: SessionRecord, participantId: string): LiveSessionSnapshot { return this.snapshot(session, false, participantId); }
  private snapshot(session: SessionRecord, teacher: boolean, participantId?: string): LiveSessionSnapshot {
    const participants: ParticipantSummary[] = [...session.participants.values()].map((participant) => ({ id: participant.id, name: participant.name, connected: participant.connected, hasSubmitted: session.submissions.has(participant.id) })); const submissions = teacher && (session.phase === "REVIEW" || session.phase === "PLAYBACK") ? [...session.submissions.values()].map(({ program: _program, ...summary }) => summary) : [];
    const selected = teacher && session.selectedParticipantId ? session.submissions.get(session.selectedParticipantId) : undefined; const selectedParticipant = selected ? session.participants.get(selected.participantId) : undefined; const selectedSubmission: SelectedSubmission | null = selected && selectedParticipant ? { participantId: selected.participantId, participantName: selectedParticipant.name, program: selected.program, correct: selected.correct, blockCount: selected.blockCount, executionSteps: selected.executionSteps } : null; const ownSubmission = !teacher && participantId ? session.submissions.get(participantId)?.program ?? null : null;
    return { sessionId: session.id, code: session.code, phase: session.phase, participants, activeCampaignId: session.activeCampaignId, activeChallengeId: session.activeChallengeId, roundId: session.roundId, submissionCount: session.submissions.size, submissions, selectedParticipantId: session.selectedParticipantId, selectedSubmission, ownSubmission, teacherConnected: session.teacherConnected };
  }
  private touch(session: SessionRecord, at = this.clock()): void { session.lastActivityAt = at; }
  private log(event: string, session: SessionRecord, fields: Omit<SessionLogEvent, "event" | "at" | "sessionId" | "code"> = {}, at = this.clock()): void { this.logger({ event, at, sessionId: session.id, code: session.code, ...fields }); }
  private requirePhase(session: SessionRecord, valid: readonly SessionRecord["phase"][]): void { if (!valid.includes(session.phase)) throw new LiveDomainError("INVALID_PHASE", `Action is not available during ${session.phase}`); }
  private findTeacher(token: string): SessionRecord | undefined { this.cleanupExpired(); return [...this.sessions.values()].find((session) => session.teacherToken === token); } private requireTeacher(token: string): SessionRecord { const session = this.findTeacher(token); if (!session) throw new LiveDomainError("UNABLE_TO_RECONNECT", "Teacher session is unavailable"); return session; }
  private findParticipant(token: string): { session: SessionRecord; participant: ParticipantRecord } | undefined { this.cleanupExpired(); for (const session of this.sessions.values()) for (const participant of session.participants.values()) if (participant.token === token) return { session, participant }; return undefined; } private requireParticipant(token: string): { session: SessionRecord; participant: ParticipantRecord } { const found = this.findParticipant(token); if (!found) throw new LiveDomainError("UNABLE_TO_RECONNECT", "Participant session is unavailable"); return found; }
}
