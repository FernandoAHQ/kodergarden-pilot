import "reflect-metadata";
import { AppDataSource } from "../database.js";
import { seedAdmin } from "./seed-admin.js";

const email = process.env.ADMIN_EMAIL ?? "";
const password = process.env.ADMIN_PASSWORD ?? "";
const displayName = process.env.ADMIN_DISPLAY_NAME ?? "Kodergarden Admin";
await AppDataSource.initialize();
try { console.log(`admin seed: ${await seedAdmin(AppDataSource, email, password, displayName)}`); }
finally { await AppDataSource.destroy(); }
