import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("healthz")
  health(): { readonly status: "ok" } {
    return { status: "ok" };
  }

  @Get("readyz")
  ready(): { readonly status: "ready" } {
    return { status: "ready" };
  }
}
