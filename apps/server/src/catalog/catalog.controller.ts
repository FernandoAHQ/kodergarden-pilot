import { Controller, Get, Param, Query } from "@nestjs/common";
import type { CampaignResponseV1, CatalogResponseV1 } from "@kodergarden/shared";
import { CatalogService } from "./catalog.service.js";

@Controller("api")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get("catalog") summaries(@Query("locale") locale?: string): Promise<CatalogResponseV1> { return this.catalog.summaries(locale); }
  @Get("campaigns/:slug") campaign(@Param("slug") slug: string, @Query("locale") locale?: string): Promise<CampaignResponseV1> { return this.catalog.campaign(slug, locale); }
}
