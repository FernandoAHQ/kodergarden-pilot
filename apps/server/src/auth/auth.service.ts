import { createHash, randomBytes } from "node:crypto";
import { ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { AdminSessionResponseV1 } from "@kodergarden/shared";
import { LessThan, Repository } from "typeorm";
import { AdminSessionEntity, AdminUserEntity } from "./auth.entities.js";
import { hashPassword, verifyPassword } from "./password.js";

export const ADMIN_COOKIE = "kodergarden_admin";
const sessionHours = 12;
const attemptsWindowMs = 15 * 60_000;
const maxAttempts = 5;
const dummyHash = await hashPassword("not-a-real-administrator-password");

export interface RequestLike { readonly headers: Record<string, string | string[] | undefined>; readonly ip?: string }
export interface ResponseLike { cookie(name: string, value: string, options: Record<string, unknown>): void; clearCookie(name: string, options: Record<string, unknown>): void }
interface LoginAttempt { count: number; resetAt: number }

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, LoginAttempt>();
  constructor(
    @InjectRepository(AdminUserEntity) private readonly users: Repository<AdminUserEntity>,
    @InjectRepository(AdminSessionEntity) private readonly sessions: Repository<AdminSessionEntity>,
  ) {}

  async login(emailInput: unknown, passwordInput: unknown, request: RequestLike, response: ResponseLike): Promise<AdminSessionResponseV1> {
    const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
    const password = typeof passwordInput === "string" ? passwordInput : "";
    const key = request.ip ?? "unknown";
    this.checkAttempts(key);
    const user = email ? await this.users.findOneBy({ email }) : null;
    const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash);
    if (!user || user.disabledAt || !valid) { this.recordFailure(key); throw new UnauthorizedException("Invalid email or password"); }
    this.attempts.delete(key);
    await this.sessions.delete({ expiresAt: LessThan(new Date()) });
    const token = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionHours * 60 * 60_000);
    await this.sessions.save(this.sessions.create({ userId: user.id, tokenHash: this.tokenHash(token), csrfToken, expiresAt, lastSeenAt: new Date() }));
    this.setCookie(response, token, expiresAt);
    return this.response(user, csrfToken, expiresAt);
  }

  async current(request: RequestLike): Promise<{ session: AdminSessionEntity; user: AdminUserEntity }> {
    const token = this.cookie(request.headers.cookie, ADMIN_COOKIE);
    if (!token) throw new UnauthorizedException("Admin session required");
    const session = await this.sessions.findOne({ where: { tokenHash: this.tokenHash(token) }, relations: { user: true } });
    if (!session || session.expiresAt <= new Date() || session.user.disabledAt) {
      if (session) await this.sessions.delete(session.id);
      throw new UnauthorizedException("Admin session expired");
    }
    if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) await this.sessions.update(session.id, { lastSeenAt: new Date() });
    return { session, user: session.user };
  }

  async sessionResponse(request: RequestLike): Promise<AdminSessionResponseV1> {
    const { session, user } = await this.current(request);
    return this.response(user, session.csrfToken, session.expiresAt);
  }

  async logout(request: RequestLike, response: ResponseLike): Promise<void> {
    const { session } = await this.current(request);
    const csrf = request.headers["x-kodergarden-csrf"];
    if (typeof csrf !== "string" || csrf !== session.csrfToken) throw new ForbiddenException("Invalid CSRF token");
    await this.sessions.delete(session.id);
    response.clearCookie(ADMIN_COOKIE, this.cookieOptions());
  }

  private response(user: AdminUserEntity, csrfToken: string, expiresAt: Date): AdminSessionResponseV1 {
    return { version: 1, user: { id: user.id, email: user.email, displayName: user.displayName }, csrfToken, expiresAt: expiresAt.toISOString() };
  }
  private tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
  private setCookie(response: ResponseLike, token: string, expiresAt: Date) { response.cookie(ADMIN_COOKIE, token, { ...this.cookieOptions(), expires: expiresAt }); }
  private cookieOptions() { return { httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/" }; }
  private cookie(header: string | string[] | undefined, name: string): string | null {
    const source = Array.isArray(header) ? header.join(";") : header ?? "";
    for (const part of source.split(";")) { const [key, ...rest] = part.trim().split("="); if (key === name) { try { return decodeURIComponent(rest.join("=")); } catch { return null; } } }
    return null;
  }
  private checkAttempts(key: string) { const value = this.attempts.get(key); if (!value) return; if (value.resetAt <= Date.now()) this.attempts.delete(key); else if (value.count >= maxAttempts) throw new HttpException("Try again later", HttpStatus.TOO_MANY_REQUESTS); }
  private recordFailure(key: string) { const current = this.attempts.get(key); this.attempts.set(key, !current || current.resetAt <= Date.now() ? { count: 1, resetAt: Date.now() + attemptsWindowMs } : { ...current, count: current.count + 1 }); }
}
