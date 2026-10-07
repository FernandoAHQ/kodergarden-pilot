import { AppDataSource } from "../database.js";
import { seedCatalog } from "./seed-catalog.js";

await AppDataSource.initialize();
try {
  await seedCatalog(AppDataSource);
  console.log("Catalog seed complete");
} finally {
  await AppDataSource.destroy();
}
