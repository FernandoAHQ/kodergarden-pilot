import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (password: string, salt: Buffer, length: number, options: ScryptOptions): Promise<Buffer> => new Promise((resolve, reject) => {
  scryptCallback(password, salt, length, options, (error, derived) => error ? reject(error) : resolve(derived));
});
const keyLength = 64;
const cost = 16_384;
const blockSize = 8;
const parallelization = 1;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, keyLength, { N: cost, r: blockSize, p: parallelization, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${cost}$${blockSize}$${parallelization}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, n, r, p, saltValue, hashValue] = encoded.split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64url");
  if (expected.length !== keyLength) return false;
  try {
    const actual = await scrypt(password, Buffer.from(saltValue, "base64url"), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}
