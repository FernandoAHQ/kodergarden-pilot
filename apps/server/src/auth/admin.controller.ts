import { Controller, Get, Header, Req } from "@nestjs/common";
import type { AdminCatalogResponseV1 } from "@kodergarden/shared";
import { CatalogService } from "../catalog/catalog.service.js";
import { AuthService, type RequestLike } from "./auth.service.js";

@Controller("api/admin")
export class AdminController {
  constructor(private readonly auth: AuthService, private readonly catalog: CatalogService) {}
  @Get("catalog") @Header("Cache-Control", "no-store")
  async catalogOverview(@Req() request: RequestLike): Promise<AdminCatalogResponseV1> {
    await this.auth.current(request);
    const catalog = await this.catalog.summaries("en");
    return { version: 1, campaigns: catalog.campaigns };
  }
}
