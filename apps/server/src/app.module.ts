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
import { authEntities } from "./auth/auth.entities.js";
import { AuthService } from "./auth/auth.service.js";
import { AuthController } from "./auth/auth.controller.js";
import { AdminController } from "./auth/admin.controller.js";
import { AdminPageController } from "./admin-page.controller.js";
import { AdminCatalogService } from "./catalog/admin-catalog.service.js";

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot(databaseOptions), TypeOrmModule.forFeature([...catalogEntities, ...authEntities])], controllers: [HealthController, CatalogController, AuthController, AdminController, AdminPageController], providers: [CatalogService, AdminCatalogService, AuthService, LiveSessionService, LiveGateway] })
export class AppModule {}
