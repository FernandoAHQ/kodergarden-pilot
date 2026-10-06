export function allowedOrigins(): readonly string[] {
  const origins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (origins.includes("*")) throw new Error("CORS_ORIGINS must contain exact origins; wildcard access is not allowed");
  return origins;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
