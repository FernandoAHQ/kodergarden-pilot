import { program } from "@kodergarden/language";
import { LiveDomainError, LiveSessionService } from "./live-session.service.js";

let passed = 0;
const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); passed += 1; };
const expectCode = (code: string, action: () => unknown): void => {
  try { action(); throw new Error(`Expected ${code}`); }
  catch (error) { assert(error instanceof LiveDomainError && error.code === code, `expected ${code}`); }
};

let token = 0;
let now = 100;
const codes = ["123456", "123456", "654321"];
const service = new LiveSessionService({ codeGenerator: () => codes.shift() ?? "999999", tokenGenerator: () => `token-${++token}`, clock: () => now++, sweepIntervalMs: 0, logger: () => {} });

const created = service.createSession();
assert(created.snapshot.phase === "LOBBY" && created.snapshot.code === "123456", "creates a lobby with six-digit code");
const second = service.createSession();
assert(second.snapshot.code === "654321", "join codes are unique among active sessions");
expectCode("SESSION_NOT_FOUND", () => service.joinParticipant("000000", "Ada"));
expectCode("INVALID_NAME", () => service.joinParticipant("123456", "   "));

const ada = service.joinParticipant("123 456", "Ada");
assert(ada.snapshot.participants.length === 1 && ada.snapshot.participants[0]?.connected, "participant joins immediately");
expectCode("NAME_TAKEN", () => service.joinParticipant("123456", "ada"));
const adaReconnect = service.reconnectParticipant(ada.participantToken);
assert(adaReconnect.participantId === ada.participantId && adaReconnect.snapshot.participants.length === 1, "participant reconnect does not duplicate identity");
const grace = service.joinParticipant("123456", "Grace");
assert(grace.snapshot.participants.length === 2, "multiple participants can join");
expectCode("UNABLE_TO_RECONNECT", () => service.selectChallenge(ada.participantToken, "sequence-01"));
expectCode("UNABLE_TO_RECONNECT", () => service.startChallenge(ada.participantToken));
expectCode("UNABLE_TO_RECONNECT", () => service.closeSubmissions(ada.participantToken));
expectCode("UNABLE_TO_RECONNECT", () => service.selectSubmission(ada.participantToken, grace.participantId));
expectCode("UNABLE_TO_RECONNECT", () => service.returnToReview(ada.participantToken));
expectCode("UNABLE_TO_RECONNECT", () => service.endSession(ada.participantToken));
expectCode("UNABLE_TO_RECONNECT", () => service.reconnectTeacher("student-token"));
expectCode("INVALID_PHASE", () => service.startChallenge(created.teacherToken));
expectCode("INVALID_CHALLENGE", () => service.selectChallenge(created.teacherToken, "missing"));

const preview = service.selectChallenge(created.teacherToken, "sequence-01");
assert(preview.phase === "CHALLENGE_PREVIEW" && preview.activeChallengeId === "sequence-01", "teacher selects an existing challenge");
expectCode("INVALID_PHASE", () => service.closeSubmissions(created.teacherToken));
const programming = service.startChallenge(created.teacherToken);
assert(programming.phase === "PROGRAMMING" && programming.roundId !== null, "start creates a programming round");
const round = programming.roundId!;
expectCode("ROUND_MISMATCH", () => service.submitSolution(ada.participantToken, "old-round", "sequence-01", program([])));
expectCode("INVALID_SUBMISSION", () => service.submitSolution(ada.participantToken, round, "sequence-01", program([{ type: "turnRight" }])));
expectCode("INVALID_SUBMISSION", () => service.submitSolution(ada.participantToken, round, "sequence-01", { version: 1, statements: [{ type: "repeat", count: 1000, body: [] }] }));

const correct = program([{ type: "moveForward" }, { type: "moveForward" }]);
const incorrect = program([{ type: "moveForward" }]);
service.submitSolution(ada.participantToken, round, "sequence-01", correct);
const restoredAda = service.reconnectParticipant(ada.participantToken);
assert(restoredAda.snapshot.ownSubmission?.statements.length === 2 && restoredAda.snapshot.selectedSubmission === null, "student reconnect restores only their own submitted AST");
let teacher = service.getTeacherSnapshot(created.teacherToken);
assert(teacher.submissionCount === 1 && teacher.submissions.length === 0, "programming snapshot exposes count without correctness");
service.submitSolution(ada.participantToken, round, "sequence-01", incorrect);
assert(service.getTeacherSnapshot(created.teacherToken).submissionCount === 1, "resubmission replaces previous submission");
service.submitSolution(ada.participantToken, round, "sequence-01", correct);
service.submitSolution(grace.participantToken, round, "sequence-01", correct);
const graceStudent = service.getStudentSnapshot(grace.participantToken);
assert(graceStudent.submissions.length === 0 && graceStudent.selectedSubmission === null && graceStudent.ownSubmission?.statements.length === 2, "student snapshot contains only that student's own program");

const review = service.closeSubmissions(created.teacherToken);
assert(review.phase === "REVIEW" && review.submissions.length === 2, "closing submissions enters review");
const adaSummary = review.submissions.find((submission) => submission.participantId === ada.participantId);
assert(adaSummary?.correct && adaSummary.blockCount === 2 && adaSummary.executionSteps === 2, "server independently evaluates correctness and metrics");
const exported = service.exportSession(created.teacherToken);
const adaExport = exported.rounds[0]?.participants.find((participant) => participant.participantId === ada.participantId);
assert(exported.rounds.length === 1 && adaExport?.submissionAttempts === 3 && adaExport.resubmissions === 2 && adaExport.correct === true, "pilot export summarizes attempts and final metrics");
const exportedJson = JSON.stringify(exported);
assert(!exportedJson.includes('"teacherToken"') && !exportedJson.includes('"participantToken"') && !exportedJson.includes('"program"'), "pilot export excludes capabilities and full ASTs");
expectCode("SUBMISSIONS_CLOSED", () => service.submitSolution(ada.participantToken, round, "sequence-01", correct));

const fewest = service.quickPick(created.teacherToken, "fewest");
assert(fewest.phase === "PLAYBACK" && fewest.selectedParticipantId === ada.participantId, "fewest blocks uses stable earliest tie handling");
assert(fewest.selectedSubmission?.program.statements.length === 2, "selected playback contains the validated AST");
const back = service.returnToReview(created.teacherToken);
assert(back.phase === "REVIEW" && back.selectedSubmission === null, "teacher returns to review");
const earliest = service.quickPick(created.teacherToken, "earliest");
assert(earliest.selectedParticipantId === ada.participantId, "earliest correct selection is deterministic");
service.returnToReview(created.teacherToken);

const nextPreview = service.selectChallenge(created.teacherToken, "turn-01");
assert(nextPreview.phase === "CHALLENGE_PREVIEW" && nextPreview.participants.length === 2, "next challenge preserves participants");
const nextRound = service.startChallenge(created.teacherToken);
assert(nextRound.submissionCount === 0 && nextRound.roundId !== round && service.getStudentSnapshot(ada.participantToken).ownSubmission === null, "new round clears active submissions");
const ended = service.endSession(created.teacherToken);
assert(ended.phase === "ENDED", "teacher ends session");
expectCode("UNABLE_TO_RECONNECT", () => service.reconnectParticipant(ada.participantToken));

let collisionToken = 0;
const collisions = new LiveSessionService({ codeGenerator: () => "111111", tokenGenerator: () => `collision-${++collisionToken}`, sweepIntervalMs: 0, logger: () => {} });
collisions.createSession();
expectCode("INVALID_CODE", () => collisions.createSession());
assert(collisions.getSessionCount() === 1, "join-code exhaustion never overwrites an active session");
collisions.onModuleDestroy();

let expiryNow = 1_000;
const expiry = new LiveSessionService({ codeGenerator: () => "222222", tokenGenerator: (() => { let value = 0; return () => `expiry-${++value}`; })(), clock: () => expiryNow, sessionTtlMs: 100, sweepIntervalMs: 0, logger: () => {} });
const expiring = expiry.createSession();
expiryNow += 101;
assert(expiry.cleanupExpired() === 1 && expiry.getSessionCount() === 0, "inactive sessions expire and are removed");
expectCode("UNABLE_TO_RECONNECT", () => expiry.reconnectTeacher(expiring.teacherToken));
expiry.onModuleDestroy();
service.onModuleDestroy();

console.log(`live session domain: ${passed} tests passed`);
