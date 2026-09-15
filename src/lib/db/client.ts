import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Lazy singleton so `next build` (and any module that imports this) doesn't
// require DATABASE_URL to be set — it's only read when a query actually runs.
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL env var.");

  // prepare: false — Supabase's (and Neon's) transaction pooler doesn't
  // support prepared statements. Same lesson as replylane; see PROJECT_BRIEF.md.
  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}
