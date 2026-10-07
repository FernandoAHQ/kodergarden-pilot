import "dotenv/config";
import { DataSource, type DataSourceOptions } from "typeorm";
import { catalogEntities } from "./catalog/catalog.entities.js";
import { InitialCatalogSchema1791394000000 } from "./migrations/1791394000000-InitialCatalogSchema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

export const databaseOptions: DataSourceOptions = {
  type: "postgres",
  url: databaseUrl,
  entities: catalogEntities,
  migrations: [InitialCatalogSchema1791394000000],
  synchronize: false,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(databaseOptions);
