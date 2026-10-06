import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const tsc = fileURLToPath(import.meta.resolve("typescript/lib/tsc.js"));
const project = fileURLToPath(new URL("../tsconfig.json", import.meta.url));
const main = fileURLToPath(new URL("../dist/main.js", import.meta.url));

const initial = spawnSync(process.execPath, [tsc, "-p", project], { stdio: "inherit" });
if (initial.status !== 0) process.exit(initial.status ?? 1);

const children = [
  spawn(process.execPath, [tsc, "-p", project, "--watch", "--preserveWatchOutput"], { stdio: "inherit" }),
  spawn(process.execPath, ["--watch", main], { stdio: "inherit" }),
];

let stopping = false;
const stop = (signal = "SIGTERM") => {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill(signal);
};

for (const child of children) child.on("exit", (code) => {
  if (stopping || code === 0 || code === null) return;
  stop();
  process.exitCode = code;
});

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
process.on("exit", () => stop());
