import { Body, Controller, Get, Header, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { AdminSessionResponseV1 } from "@kodergarden/shared";
import { AuthService, type RequestLike, type ResponseLike } from "./auth.service.js";

@Controller("api/admin/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("login") @HttpCode(200) @Header("Cache-Control", "no-store")
  login(@Body() body: { readonly email?: unknown; readonly password?: unknown }, @Req() request: RequestLike, @Res({ passthrough: true }) response: ResponseLike): Promise<AdminSessionResponseV1> {
    return this.auth.login(body?.email, body?.password, request, response);
  }
  @Get("session") @Header("Cache-Control", "no-store") session(@Req() request: RequestLike): Promise<AdminSessionResponseV1> { return this.auth.sessionResponse(request); }
  @Post("logout") @HttpCode(204) @Header("Cache-Control", "no-store")
  async logout(@Req() request: RequestLike, @Res({ passthrough: true }) response: ResponseLike): Promise<void> { await this.auth.logout(request, response); }
}
