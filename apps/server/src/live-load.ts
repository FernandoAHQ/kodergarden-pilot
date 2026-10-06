import "reflect-metadata";
import { performance } from "node:perf_hooks";
import { NestFactory } from "@nestjs/core";
import { io, type Socket } from "socket.io-client";
import { program, type Program } from "@kodergarden/language";
import type { CreateSessionResult, JoinSessionResult, LiveResult, LiveSessionSnapshot, PilotSessionExport } from "@kodergarden/shared";
import { AppModule } from "./app.module.js";

const studentTarget = Math.max(1, Number(process.env.LIVE_LOAD_STUDENTS ?? 40));
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const percentile = (values: readonly number[], fraction: number): number => values.length === 0 ? 0 : [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil(values.length * fraction) - 1)]!;
const emitResult = <T>(socket: Socket, event: string, payload: unknown): Promise<LiveResult<T>> => new Promise((resolve) => socket.emit(event, payload, resolve));
const emitOk = async <T>(socket: Socket, event: string, payload: unknown): Promise<T> => { const result = await emitResult<T>(socket, event, payload); if (!result.ok) throw new Error(`${event}:${result.error.code}`); return result.value; };
const connect = (url: string, onError: () => void): Promise<Socket> => new Promise((resolve, reject) => { const socket = io(url, { transports: ["websocket"], reconnection: false }); socket.on("connect_error", onError); socket.once("connect", () => resolve(socket)); socket.once("connect_error", reject); });

interface Metrics {
  studentsRequested: number; studentsJoined: number; duplicateParticipants: number; joinFailures: number;
  submissionAttempts: number; acceptedSubmissions: number; rejectedSubmissions: number; resubmissions: number;
  reconnectSuccesses: number; reconnectFailures: number; socketErrors: number; serverExceptions: number;
}

const metrics: Metrics = { studentsRequested: studentTarget, studentsJoined: 0, duplicateParticipants: 0, joinFailures: 0, submissionAttempts: 0, acceptedSubmissions: 0, rejectedSubmissions: 0, resubmissions: 0, reconnectSuccesses: 0, reconnectFailures: 0, socketErrors: 0, serverExceptions: 0 };
const latencies: number[] = [];
const startedAt = performance.now();
const originalError = console.error;
console.error = (...args: unknown[]) => { metrics.serverExceptions += 1; originalError(...args); };
const app = await NestFactory.create(AppModule, { logger: false });
await app.listen(0, "127.0.0.1");
const address = app.getHttpServer().address() as { port: number };
const url = `http://127.0.0.1:${address.port}`;
const sockets: Socket[] = [];

try {
  const teacher = await connect(url, () => { metrics.socketErrors += 1; }); sockets.push(teacher);
  const created = await emitOk<CreateSessionResult>(teacher, "teacher:create", {});

  const joined = await Promise.all(Array.from({ length: studentTarget }, async (_, index) => {
    try {
      await delay(Math.floor(Math.random() * 150));
      const socket = await connect(url, () => { metrics.socketErrors += 1; }); sockets.push(socket);
      const result = await emitOk<JoinSessionResult>(socket, "student:join", { code: created.snapshot.code, name: `Student ${String(index + 1).padStart(2, "0")}` });
      metrics.studentsJoined += 1; return { socket, ...result };
    } catch { metrics.joinFailures += 1; return null; }
  }));
  const students = joined.filter((value): value is NonNullable<typeof value> => value !== null);
  const lobby = await emitOk<LiveSessionSnapshot>(teacher, "teacher:reconnect", { token: created.teacherToken });
  metrics.duplicateParticipants = lobby.participants.length - new Set(lobby.participants.map((participant) => participant.id)).size;
  if (lobby.participants.length !== studentTarget) throw new Error(`join-count:${lobby.participants.length}`);

  await emitOk<LiveSessionSnapshot>(teacher, "teacher:selectChallenge", { token: created.teacherToken, challengeId: "sequence-01" });
  const programming = await emitOk<LiveSessionSnapshot>(teacher, "teacher:startChallenge", { token: created.teacherToken });
  if (programming.phase !== "PROGRAMMING" || !programming.roundId) throw new Error("challenge-start-state");

  const correct = program([{ type: "moveForward" }, { type: "moveForward" }]);
  const incorrect = program([{ type: "moveForward" }]);
  const wall = program(Array.from({ length: 10 }, () => ({ type: "moveForward" as const })));
  const inefficient = program([{ type: "moveForward" }, { type: "moveForward" }, { type: "moveForward" }]);
  const variants: readonly Program[] = [correct, incorrect, wall, inefficient];
  const submit = async (student: (typeof students)[number], candidate: unknown, countAsResubmission = false): Promise<LiveResult<LiveSessionSnapshot>> => {
    metrics.submissionAttempts += 1; if (countAsResubmission) metrics.resubmissions += 1;
    const start = performance.now(); const result = await emitResult<LiveSessionSnapshot>(student.socket, "student:submit", { participantToken: student.participantToken, roundId: programming.roundId, challengeId: "sequence-01", program: candidate });
    latencies.push(performance.now() - start); if (result.ok) metrics.acceptedSubmissions += 1; else metrics.rejectedSubmissions += 1; return result;
  };
  await Promise.all(students.map(async (student, index) => { await delay(Math.floor(Math.random() * 1_000)); const result = await submit(student, variants[index % variants.length]!); if (!result.ok) throw new Error(`initial-submit:${result.error.code}`); }));
  await Promise.all(students.slice(0, Math.ceil(students.length / 2)).map((student) => submit(student, correct, true)));

  const reconnecting = students.slice(0, Math.min(8, students.length));
  for (const student of reconnecting) student.socket.disconnect();
  await Promise.all(reconnecting.map(async (student) => {
    try { const socket = await connect(url, () => { metrics.socketErrors += 1; }); sockets.push(socket); const result = await emitOk<JoinSessionResult>(socket, "student:reconnect", { token: student.participantToken }); student.socket = socket; if (result.participantId !== student.participantId) throw new Error("identity-changed"); metrics.reconnectSuccesses += 1; }
    catch { metrics.reconnectFailures += 1; }
  }));
  const afterReconnect = await emitOk<LiveSessionSnapshot>(teacher, "teacher:reconnect", { token: created.teacherToken });
  metrics.duplicateParticipants = afterReconnect.participants.length - new Set(afterReconnect.participants.map((participant) => participant.id)).size;
  if (afterReconnect.participants.length !== studentTarget) throw new Error(`reconnect-count:${afterReconnect.participants.length}`);

  const hostile: unknown[] = [
    { version: 1, statements: [{ nope: true }] },
    program(Array.from({ length: 101 }, () => ({ type: "moveForward" as const }))),
    { version: 1, statements: [{ type: "repeat", count: 1000, body: [] }] },
  ];
  for (const payload of hostile) { const result = await submit(students[0]!, payload); if (result.ok || result.error.code !== "INVALID_SUBMISSION") throw new Error("hostile-payload-accepted"); }
  const wrongRound = await emitResult<LiveSessionSnapshot>(students[0]!.socket, "student:submit", { participantToken: students[0]!.participantToken, roundId: "wrong-round", challengeId: "sequence-01", program: correct }); metrics.submissionAttempts += 1; wrongRound.ok ? metrics.acceptedSubmissions += 1 : metrics.rejectedSubmissions += 1;
  if (wrongRound.ok || wrongRound.error.code !== "ROUND_MISMATCH") throw new Error("wrong-round-accepted");
  const invalidChallenge = await emitResult<LiveSessionSnapshot>(students[0]!.socket, "student:submit", { participantToken: students[0]!.participantToken, roundId: programming.roundId, challengeId: "not-a-challenge", program: correct }); metrics.submissionAttempts += 1; invalidChallenge.ok ? metrics.acceptedSubmissions += 1 : metrics.rejectedSubmissions += 1;
  if (invalidChallenge.ok || invalidChallenge.error.code !== "ROUND_MISMATCH") throw new Error("invalid-challenge-accepted");
  const unauthorized = await emitResult<LiveSessionSnapshot>(students[0]!.socket, "teacher:endSession", { token: students[0]!.participantToken });
  if (unauthorized.ok) throw new Error("student-teacher-action-authorized");

  const close = emitOk<LiveSessionSnapshot>(teacher, "teacher:closeSubmissions", { token: created.teacherToken });
  const nearClose = Promise.all(students.slice(0, 10).map((student) => submit(student, correct, true)));
  const review = await close; await nearClose;
  if (review.phase !== "REVIEW") throw new Error("close-state");
  const late = await submit(students[0]!, correct, true); if (late.ok || late.error.code !== "SUBMISSIONS_CLOSED") throw new Error("late-submission-accepted");

  const exported = await emitOk<PilotSessionExport>(teacher, "teacher:export", { token: created.teacherToken });
  if (exported.rounds.length !== 1 || JSON.stringify(exported).includes("participantToken")) throw new Error("export-invalid");

  const totalDurationMs = performance.now() - startedAt;
  const average = latencies.reduce((sum, value) => sum + value, 0) / Math.max(1, latencies.length);
  console.log(JSON.stringify({ scenario: "live-classroom-40", ...metrics, submissionLatencyMs: { average: Number(average.toFixed(2)), p50: Number(percentile(latencies, .5).toFixed(2)), p95: Number(percentile(latencies, .95).toFixed(2)), max: Number(Math.max(0, ...latencies).toFixed(2)) }, totalScenarioDurationMs: Number(totalDurationMs.toFixed(2)), finalPhase: review.phase, finalSubmissionCount: review.submissionCount }, null, 2));
  if (metrics.studentsJoined !== studentTarget || metrics.duplicateParticipants !== 0 || metrics.joinFailures !== 0 || metrics.reconnectFailures !== 0 || metrics.serverExceptions !== 0) process.exitCode = 1;
} finally {
  for (const socket of sockets) socket.disconnect(); await app.close(); console.error = originalError;
}
