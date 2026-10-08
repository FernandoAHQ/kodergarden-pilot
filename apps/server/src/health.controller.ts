import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { CatalogService } from "./catalog/catalog.service.js";

@Controller()
export class HealthController {
  constructor(private readonly catalog: CatalogService) {}
  @Get("healthz")
  health(): { readonly status: "ok" } {
    return { status: "ok" };
  }

  @Get("readyz")
  async ready(): Promise<{ readonly status: "ready" | "unavailable" }> {
    if (!await this.catalog.isReady()) throw new ServiceUnavailableException({ status: "unavailable" });
    return { status: "ready" };
  }
}
