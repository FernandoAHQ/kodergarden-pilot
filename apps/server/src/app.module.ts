import { Module } from "@nestjs/common";
import { LiveGateway } from "./live.gateway.js";
import { LiveSessionService } from "./live-session.service.js";
import { HealthController } from "./health.controller.js";

@Module({ controllers: [HealthController], providers: [LiveSessionService, LiveGateway] })
export class AppModule {}
