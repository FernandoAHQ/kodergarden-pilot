import type { DataSource } from "typeorm";
import { AdminUserEntity } from "./auth.entities.js";
import { hashPassword } from "./password.js";

export async function seedAdmin(dataSource: DataSource, emailInput: string, password: string, displayNameInput: string): Promise<"created" | "exists"> {
  const email = emailInput.trim().toLowerCase();
  const displayName = displayNameInput.trim();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) throw new Error("ADMIN_EMAIL must be a valid email address");
  if (password.length < 12 || password.length > 200) throw new Error("ADMIN_PASSWORD must contain 12 to 200 characters");
  if (!displayName || displayName.length > 120) throw new Error("ADMIN_DISPLAY_NAME must contain 1 to 120 characters");
  const users = dataSource.getRepository(AdminUserEntity);
  if (await users.existsBy({ email })) return "exists";
  await users.save(users.create({ email, displayName, passwordHash: await hashPassword(password), disabledAt: null }));
  return "created";
}
