import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { io, type Socket } from "socket.io-client";
import { program } from "@kodergarden/language";
import type { CreateSessionResult, JoinSessionResult, LiveResult, LiveSessionSnapshot, PilotSessionExport } from "@kodergarden/shared";
import { AppModule } from "./app.module.js";

let passed = 0;
const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); passed += 1; };
const connect = (url: string): Promise<Socket> => new Promise((resolve, reject) => { const socket = io(url, { transports: ["websocket"] }); socket.once("connect", () => resolve(socket)); socket.once("connect_error", reject); });
const emit = <T>(socket: Socket, event: string, payload: unknown): Promise<T> => new Promise((resolve, reject) => socket.emit(event, payload, (result: LiveResult<T>) => result.ok ? resolve(result.value) : reject(new Error(result.error.code))));
const expectReject = async (code: string, action: () => Promise<unknown>): Promise<void> => { try { await action(); throw new Error(`Expected ${code}`); } catch (error) { assert(error instanceof Error && error.message === code, `socket rejects ${code}`); } };
const nextSnapshot = (socket: Socket): Promise<LiveSessionSnapshot> => new Promise((resolve) => socket.once("session:snapshot", resolve));

const app = await NestFactory.create(AppModule, { logger: false });
await app.listen(0, "127.0.0.1");
const address = app.getHttpServer().address() as { port: number };
const url = `http://127.0.0.1:${address.port}`;
const teacher = await connect(url);
const student = await connect(url);

try {
  const created = await emit<CreateSessionResult>(teacher, "teacher:create", {});
  assert(created.snapshot.phase === "LOBBY", "socket teacher creates a lobby");
  const teacherJoinUpdate = nextSnapshot(teacher);
  const joined = await emit<JoinSessionResult>(student, "student:join", { code: created.snapshot.code, name: "Sofía" });
  assert(joined.snapshot.participants.length === 1, "socket student joins");
  assert((await teacherJoinUpdate).participants.length === 1, "teacher receives participant snapshot");

  const studentCampaign = nextSnapshot(student);
  const campaign = await emit<LiveSessionSnapshot>(teacher, "teacher:selectCampaign", { token: created.teacherToken, campaignId: "foundations" });
  assert(campaign.activeCampaignId === "foundations", "teacher selects campaign over socket");
  assert((await studentCampaign).activeCampaignId === "foundations", "student receives campaign selection");
  const studentPreview = nextSnapshot(student);
  const preview = await emit<LiveSessionSnapshot>(teacher, "teacher:selectChallenge", { token: created.teacherToken, challengeId: "sequence-01" });
  assert(preview.phase === "CHALLENGE_PREVIEW", "teacher selects challenge over socket");
  assert((await studentPreview).activeChallengeId === "sequence-01", "student receives challenge preview");

  const studentProgramming = nextSnapshot(student);
  const programming = await emit<LiveSessionSnapshot>(teacher, "teacher:startChallenge", { token: created.teacherToken });
  assert(programming.phase === "PROGRAMMING" && programming.roundId, "teacher starts programming phase");
  assert((await studentProgramming).phase === "PROGRAMMING", "student receives programming phase");
  await expectReject("UNABLE_TO_RECONNECT", () => emit(student, "teacher:closeSubmissions", { token: joined.participantToken }));

  const teacherSubmission = nextSnapshot(teacher);
  await emit<LiveSessionSnapshot>(student, "student:submit", { participantToken: joined.participantToken, roundId: programming.roundId, challengeId: "sequence-01", program: program([{ type: "moveForward" }, { type: "moveForward" }]) });
  assert((await teacherSubmission).submissionCount === 1, "teacher receives submission update");
  const studentReview = nextSnapshot(student);
  const review = await emit<LiveSessionSnapshot>(teacher, "teacher:closeSubmissions", { token: created.teacherToken });
  assert(review.phase === "REVIEW" && review.submissions[0]?.correct, "teacher closes into evaluated review");
  assert((await studentReview).phase === "REVIEW", "student receives review phase");
  const exported = await emit<PilotSessionExport>(teacher, "teacher:export", { token: created.teacherToken });
  assert(exported.rounds[0]?.participants[0]?.submissionAttempts === 1 && !JSON.stringify(exported).includes(joined.participantToken), "socket pilot export is capability-free");

  const studentEnded = nextSnapshot(student);
  const ended = await emit<LiveSessionSnapshot>(teacher, "teacher:endSession", { token: created.teacherToken });
  assert(ended.phase === "ENDED", "teacher ends the session over socket");
  assert((await studentEnded).phase === "ENDED", "student receives the ended snapshot");
} finally {
  teacher.disconnect(); student.disconnect(); await app.close();
}

console.log(`live socket integration: ${passed} tests passed`);
