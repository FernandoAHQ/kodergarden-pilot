import "dotenv/config";
import { DataSource, type DataSourceOptions } from "typeorm";
import { catalogEntities } from "./catalog/catalog.entities.js";
import { InitialCatalogSchema1791394000000 } from "./migrations/1791394000000-InitialCatalogSchema.js";
import { AdminAuthSchema1791395000000 } from "./migrations/1791395000000-AdminAuthSchema.js";
import { authEntities } from "./auth/auth.entities.js";
import { CurriculumDrafts1791396000000 } from "./migrations/1791396000000-CurriculumDrafts.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

export const databaseOptions: DataSourceOptions = {
  type: "postgres",
  url: databaseUrl,
  entities: [...catalogEntities, ...authEntities],
  migrations: [InitialCatalogSchema1791394000000, AdminAuthSchema1791395000000, CurriculumDrafts1791396000000],
  synchronize: false,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(databaseOptions);
