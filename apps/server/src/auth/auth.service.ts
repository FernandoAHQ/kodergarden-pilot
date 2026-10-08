import { createHash, randomBytes } from "node:crypto";
import { BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { AdminSessionResponseV1, AdminTeamMember, AdminTeamResponseV1 } from "@kodergarden/shared";
import { IsNull, LessThan, Repository } from "typeorm";
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
    const { session } = await this.requireCsrf(request);
    await this.sessions.delete(session.id);
    response.clearCookie(ADMIN_COOKIE, this.cookieOptions());
  }

  async requireCsrf(request: RequestLike): Promise<{ session: AdminSessionEntity; user: AdminUserEntity }> { const current=await this.current(request);const csrf=request.headers["x-kodergarden-csrf"];if(typeof csrf!=="string"||csrf!==current.session.csrfToken)throw new ForbiddenException("Invalid CSRF token");return current; }
  async requireAdminCsrf(request: RequestLike) { const current=await this.requireCsrf(request);if(current.user.role!=="admin")throw new ForbiddenException("Admin role required");return current; }

  async team(): Promise<AdminTeamResponseV1> {
    const members=await this.users.find({order:{createdAt:"ASC"}});
    return {version:1,members:members.map((user)=>this.member(user))};
  }
  async createMember(input:{email?:unknown;displayName?:unknown;password?:unknown;role?:unknown}):Promise<AdminTeamMember>{
    const email=typeof input.email==="string"?input.email.trim().toLowerCase():"";const displayName=typeof input.displayName==="string"?input.displayName.trim():"";const password=typeof input.password==="string"?input.password:"";const role=input.role;
    if(!/^\S+@\S+\.\S+$/.test(email)||email.length>320)throw new BadRequestException("Valid email is required");if(!displayName||displayName.length>120)throw new BadRequestException("Display name is required");if(password.length<12||password.length>200)throw new BadRequestException("Password must contain 12 to 200 characters");if(role!=="admin"&&role!=="viewer")throw new BadRequestException("Role must be admin or viewer");if(await this.users.existsBy({email}))throw new ConflictException("Email already exists");
    const user=await this.users.save(this.users.create({email,displayName,passwordHash:await hashPassword(password),role,disabledAt:null}));return this.member(user);
  }
  async updateMember(id:string,input:{role?:unknown;disabled?:unknown;password?:unknown}):Promise<AdminTeamMember>{
    const user=await this.users.findOneBy({id});if(!user)throw new NotFoundException("Team member not found");const role=input.role===undefined?user.role:input.role;if(role!=="admin"&&role!=="viewer")throw new BadRequestException("Role must be admin or viewer");const disabled=input.disabled===undefined?user.disabledAt!==null:input.disabled;if(typeof disabled!=="boolean")throw new BadRequestException("Disabled must be true or false");if(user.role==="admin"&&(role!=="admin"||disabled)&&await this.users.countBy({role:"admin",disabledAt:IsNull()})<=1)throw new ConflictException("At least one active admin is required");const password=input.password;if(password!==undefined&&(typeof password!=="string"||password.length<12||password.length>200))throw new BadRequestException("Password must contain 12 to 200 characters");user.role=role;user.disabledAt=disabled?user.disabledAt??new Date():null;if(typeof password==="string")user.passwordHash=await hashPassword(password);await this.users.save(user);if(disabled)await this.sessions.delete({userId:user.id});return this.member(user);
  }

  private response(user: AdminUserEntity, csrfToken: string, expiresAt: Date): AdminSessionResponseV1 {
    return { version: 1, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, csrfToken, expiresAt: expiresAt.toISOString() };
  }
  private member(user:AdminUserEntity):AdminTeamMember{return{id:user.id,email:user.email,displayName:user.displayName,role:user.role,disabled:user.disabledAt!==null,createdAt:user.createdAt.toISOString()};}
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
