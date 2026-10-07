import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { LiveGateway } from "./live.gateway.js";
import { LiveSessionService } from "./live-session.service.js";
import { HealthController } from "./health.controller.js";
import { catalogEntities } from "./catalog/catalog.entities.js";
import { CatalogController } from "./catalog/catalog.controller.js";
import { CatalogService } from "./catalog/catalog.service.js";
import { databaseOptions } from "./database.js";

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot(databaseOptions), TypeOrmModule.forFeature(catalogEntities)], controllers: [HealthController, CatalogController], providers: [CatalogService, LiveSessionService, LiveGateway] })
export class AppModule {}
