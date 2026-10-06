import { Ack as WsAck, ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import type { LiveError, LiveResult, LiveSessionSnapshot, PilotSessionExport, ServerToClientEvents } from "@kodergarden/shared";
import { LiveDomainError, LiveSessionService } from "./live-session.service.js";

type Ack<T> = (result: LiveResult<T>) => void;
interface Connection { readonly role: "teacher" | "student"; readonly token: string; readonly sessionId: string }

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class LiveGateway implements OnGatewayDisconnect {
  @WebSocketServer() private server!: Server<Record<string, never>, ServerToClientEvents>;
  private readonly connections = new Map<string, Connection>();
  constructor(private readonly sessions: LiveSessionService) {}

  @SubscribeMessage("teacher:create")
  create(@ConnectedSocket() socket: Socket, @MessageBody() _body: unknown, @WsAck() ack: Ack<ReturnType<LiveSessionService["createSession"]>>): void {
    this.respond(ack, () => { const result = this.sessions.createSession(); this.connect(socket, "teacher", result.teacherToken, result.snapshot.sessionId); return result; });
  }
  @SubscribeMessage("teacher:reconnect")
  reconnectTeacher(@ConnectedSocket() socket: Socket, @MessageBody() body: { token: string }, @WsAck() ack: Ack<LiveSessionSnapshot>): void {
    this.respond(ack, () => { const snapshot = this.sessions.reconnectTeacher(body.token); this.connect(socket, "teacher", body.token, snapshot.sessionId); this.broadcast(snapshot.sessionId); return snapshot; });
  }
  @SubscribeMessage("teacher:selectChallenge")
  selectChallenge(@MessageBody() body: { token: string; challengeId: string }, @WsAck() ack: Ack<LiveSessionSnapshot>): void { this.teacherAction(body.token, ack, () => this.sessions.selectChallenge(body.token, body.challengeId)); }
  @SubscribeMessage("teacher:startChallenge")
  startChallenge(@MessageBody() body: { token: string }, @WsAck() ack: Ack<LiveSessionSnapshot>): void { this.teacherAction(body.token, ack, () => this.sessions.startChallenge(body.token)); }
  @SubscribeMessage("teacher:closeSubmissions")
  close(@MessageBody() body: { token: string }, @WsAck() ack: Ack<LiveSessionSnapshot>): void { this.teacherAction(body.token, ack, () => this.sessions.closeSubmissions(body.token)); }
  @SubscribeMessage("teacher:selectSubmission")
  selectSubmission(@MessageBody() body: { token: string; participantId: string }, @WsAck() ack: Ack<LiveSessionSnapshot>): void { this.teacherAction(body.token, ack, () => this.sessions.selectSubmission(body.token, body.participantId)); }
  @SubscribeMessage("teacher:quickPick")
  quickPick(@MessageBody() body: { token: string; strategy: "random" | "fewest" | "earliest" }, @WsAck() ack: Ack<LiveSessionSnapshot>): void { this.teacherAction(body.token, ack, () => this.sessions.quickPick(body.token, body.strategy)); }
  @SubscribeMessage("teacher:returnToReview")
  review(@MessageBody() body: { token: string }, @WsAck() ack: Ack<LiveSessionSnapshot>): void { this.teacherAction(body.token, ack, () => this.sessions.returnToReview(body.token)); }
  @SubscribeMessage("teacher:export")
  exportSession(@MessageBody() body: { token: string }, @WsAck() ack: Ack<PilotSessionExport>): void { this.respond(ack, () => this.sessions.exportSession(body.token)); }
  @SubscribeMessage("teacher:endSession")
  end(@MessageBody() body: { token: string }, @WsAck() ack: Ack<LiveSessionSnapshot>): void {
    this.respond(ack, () => { const sessionId = this.sessions.getSessionIdForTeacher(body.token); const snapshot = this.sessions.endSession(body.token); this.server.to(sessionId).emit("session:snapshot", snapshot); for (const [socketId, connection] of this.connections) if (connection.sessionId === sessionId) this.connections.delete(socketId); return snapshot; });
  }

  @SubscribeMessage("student:join")
  join(@ConnectedSocket() socket: Socket, @MessageBody() body: { code: string; name: string }, @WsAck() ack: Ack<ReturnType<LiveSessionService["joinParticipant"]>>): void {
    this.respond(ack, () => { const result = this.sessions.joinParticipant(body.code, body.name); this.connect(socket, "student", result.participantToken, result.snapshot.sessionId); this.broadcast(result.snapshot.sessionId); return result; });
  }
  @SubscribeMessage("student:reconnect")
  reconnectStudent(@ConnectedSocket() socket: Socket, @MessageBody() body: { token: string }, @WsAck() ack: Ack<ReturnType<LiveSessionService["reconnectParticipant"]>>): void {
    this.respond(ack, () => { const result = this.sessions.reconnectParticipant(body.token); this.connect(socket, "student", body.token, result.snapshot.sessionId); this.broadcast(result.snapshot.sessionId); return result; });
  }
  @SubscribeMessage("student:submit")
  submit(@MessageBody() body: { participantToken: string; roundId: string; challengeId: string; program: unknown }, @WsAck() ack: Ack<LiveSessionSnapshot>): void {
    this.respond(ack, () => { const snapshot = this.sessions.submitSolution(body.participantToken, body.roundId, body.challengeId, body.program); const sessionId = this.sessions.getSessionIdForParticipant(body.participantToken); this.broadcast(sessionId); return snapshot; });
  }

  handleDisconnect(socket: Socket): void { const connection = this.connections.get(socket.id); if (!connection) return; this.connections.delete(socket.id); if ([...this.connections.values()].some((active) => active.token === connection.token)) return; const sessionId = this.sessions.setDisconnected(connection.token); if (sessionId) this.broadcast(sessionId); }
  private teacherAction(token: string, ack: Ack<LiveSessionSnapshot>, action: () => LiveSessionSnapshot): void { this.respond(ack, () => { const snapshot = action(); this.broadcast(snapshot.sessionId); return snapshot; }); }
  private connect(socket: Socket, role: Connection["role"], token: string, sessionId: string): void { this.connections.set(socket.id, { role, token, sessionId }); void socket.join(sessionId); }
  private broadcast(sessionId: string): void { for (const [socketId, connection] of this.connections) { if (connection.sessionId !== sessionId) continue; try { const snapshot = connection.role === "teacher" ? this.sessions.getTeacherSnapshot(connection.token) : this.sessions.getStudentSnapshot(connection.token); this.server.to(socketId).emit("session:snapshot", snapshot); } catch { this.connections.delete(socketId); } } }
  private respond<T>(ack: Ack<T>, action: () => T): void { try { ack({ ok: true, value: action() }); } catch (error) { if (!(error instanceof LiveDomainError)) console.error(JSON.stringify({ scope: "live-gateway", event: "unexpected-error", error: error instanceof Error ? error.message : String(error) })); const live: LiveError = error instanceof LiveDomainError ? { code: error.code, message: error.message } : { code: "UNAUTHORIZED", message: "Live session request failed" }; ack({ ok: false, error: live }); } }
}
