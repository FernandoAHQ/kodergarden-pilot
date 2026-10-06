import { Module } from "@nestjs/common";
import { LiveGateway } from "./live.gateway.js";
import { LiveSessionService } from "./live-session.service.js";

@Module({ providers: [LiveSessionService, LiveGateway] })
export class AppModule {}
