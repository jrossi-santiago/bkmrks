import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

export const PHASE0_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(PHASE0_DIR, "..");
export const STATE_PATH = join(PHASE0_DIR, ".state.json");
export const OUTPUT_DIR = join(REPO_ROOT, "phase0-output");

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var ${name}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
  return value;
}

export function loadState() {
  if (!existsSync(STATE_PATH)) return {};
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

export function saveState(patch) {
  const next = { ...loadState(), ...patch };
  writeFileSync(STATE_PATH, JSON.stringify(next, null, 2));
  return next;
}

export function writeOutput(name, data) {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const path = join(OUTPUT_DIR, name);
  writeFileSync(path, typeof data === "string" ? data : JSON.stringify(data, null, 2));
  return path;
}

export function headersToObject(headers) {
  const obj = {};
  for (const [key, value] of headers.entries()) obj[key] = value;
  return obj;
}

export function rateLimitHeaders(headers) {
  const obj = headersToObject(headers);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => key.toLowerCase().includes("rate-limit"))
  );
}
