import type { Program } from "@kodergarden/language";

export type LivePhase = "LOBBY" | "CHALLENGE_PREVIEW" | "PROGRAMMING" | "REVIEW" | "PLAYBACK" | "ENDED";
export type LiveErrorCode = "SESSION_NOT_FOUND" | "INVALID_CODE" | "SESSION_ENDED" | "INVALID_NAME" | "NAME_TAKEN" | "UNAUTHORIZED" | "INVALID_PHASE" | "INVALID_CHALLENGE" | "SUBMISSIONS_CLOSED" | "INVALID_SUBMISSION" | "ROUND_MISMATCH" | "UNABLE_TO_RECONNECT" | "RATE_LIMITED";

export interface LiveError { readonly code: LiveErrorCode; readonly message: string }
export interface ParticipantSummary { readonly id: string; readonly name: string; readonly connected: boolean; readonly hasSubmitted: boolean }
export interface SubmissionSummary { readonly participantId: string; readonly correct: boolean; readonly blockCount: number; readonly executionSteps: number; readonly submittedAt: number }
export interface SelectedSubmission { readonly participantId: string; readonly participantName: string; readonly program: Program; readonly correct: boolean; readonly blockCount: number; readonly executionSteps: number }
export interface LiveSessionSnapshot {
  readonly sessionId: string;
  readonly code: string;
  readonly phase: LivePhase;
  readonly participants: readonly ParticipantSummary[];
  readonly activeCampaignId: string | null;
  readonly activeChallengeId: string | null;
  readonly roundId: string | null;
  readonly submissionCount: number;
  readonly submissions: readonly SubmissionSummary[];
  readonly selectedParticipantId: string | null;
  readonly selectedSubmission: SelectedSubmission | null;
  /** Present only in that participant's role-scoped snapshot. Never contains a classmate's program. */
  readonly ownSubmission: Program | null;
  readonly teacherConnected: boolean;
}

export type LiveResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: LiveError };
export interface CreateSessionResult { readonly teacherToken: string; readonly snapshot: LiveSessionSnapshot }
export interface JoinSessionResult { readonly participantToken: string; readonly participantId: string; readonly snapshot: LiveSessionSnapshot }
export interface SessionCredentials { readonly token: string }
export interface SubmitSolutionPayload { readonly participantToken: string; readonly roundId: string; readonly challengeId: string; readonly program: Program }
export interface PilotParticipantResult { readonly participantId: string; readonly displayName: string; readonly submitted: boolean; readonly submissionAttempts: number; readonly resubmissions: number; readonly correct: boolean | null; readonly blockCount: number | null; readonly executionSteps: number | null; readonly submittedAt: number | null }
export interface PilotRoundSummary { readonly roundId: string; readonly campaignId: string; readonly challengeId: string; readonly startedAt: number; readonly closedAt: number | null; readonly participants: readonly PilotParticipantResult[] }
export interface PilotSessionExport { readonly sessionId: string; readonly code: string; readonly startedAt: number; readonly exportedAt: number; readonly phase: LivePhase; readonly rounds: readonly PilotRoundSummary[] }

export interface ClientToServerEvents {
  "teacher:create": (payload: Record<string, never>, ack: (result: LiveResult<CreateSessionResult>) => void) => void;
  "teacher:reconnect": (credentials: SessionCredentials, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "teacher:selectCampaign": (payload: SessionCredentials & { readonly campaignId: string }, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "teacher:selectChallenge": (payload: SessionCredentials & { readonly challengeId: string }, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "teacher:startChallenge": (credentials: SessionCredentials, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "teacher:closeSubmissions": (credentials: SessionCredentials, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "teacher:selectSubmission": (payload: SessionCredentials & { readonly participantId: string }, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "teacher:quickPick": (payload: SessionCredentials & { readonly strategy: "random" | "fewest" | "earliest" }, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "teacher:returnToReview": (credentials: SessionCredentials, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "teacher:export": (credentials: SessionCredentials, ack: (result: LiveResult<PilotSessionExport>) => void) => void;
  "teacher:endSession": (credentials: SessionCredentials, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
  "student:join": (payload: { readonly code: string; readonly name: string }, ack: (result: LiveResult<JoinSessionResult>) => void) => void;
  "student:reconnect": (credentials: SessionCredentials, ack: (result: LiveResult<JoinSessionResult>) => void) => void;
  "student:submit": (payload: SubmitSolutionPayload, ack: (result: LiveResult<LiveSessionSnapshot>) => void) => void;
}

export interface ServerToClientEvents {
  "session:snapshot": (snapshot: LiveSessionSnapshot) => void;
  "session:error": (error: LiveError) => void;
}
