import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Migrations run over the *direct* connection, not the transaction pooler
// (DATABASE_URL) the app uses at runtime — pgBouncer's transaction mode
// doesn't support the session-level behavior the migration tool needs
// (this is separate from, and in addition to, the `prepare: false` fix for
// the app's regular queries in src/lib/db/client.ts). Falls back to
// DATABASE_URL if DIRECT_URL isn't set, e.g. for a Postgres host with no
// separate pooler.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
