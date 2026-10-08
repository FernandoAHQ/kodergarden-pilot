import "reflect-metadata";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NestFactory } from "@nestjs/core";
import { DataSource } from "typeorm";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";
import { allowedOrigins, isProduction } from "./deployment.js";

const app = await NestFactory.create<NestExpressApplication>(AppModule);
if (await app.get(DataSource).showMigrations()) throw new Error("Database migrations are pending; run pnpm --filter @kodergarden/server migration:run");
const origins = allowedOrigins();
if (origins.length > 0) app.enableCors({ origin: [...origins], credentials: false });

app.disable("x-powered-by");
app.use((_request: unknown, response: { setHeader(name: string, value: string): void }, next: () => void) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProduction()) response.setHeader("Strict-Transport-Security", "max-age=31536000");
  next();
});

const webDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../../web/dist");
if (existsSync(webDirectory)) app.useStaticAssets(webDirectory, { index: "index.html" });
else if (isProduction()) throw new Error(`Production web build not found at ${webDirectory}`);

app.enableShutdownHooks();
await app.listen(Number(process.env.PORT ?? 3001), process.env.HOST ?? "0.0.0.0");
